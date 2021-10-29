import { address } from "bitcoinjs-lib";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
import { getAddress } from "./getAddress.js";
import { getBalanceOfAddresses } from "./getBalanceOfAddresses.js";
import { saveAddress, getSavedAddresses } from "./getOrSaveDerivationPath.js"


export const getBalanceOfWallet = async (xpub, purpose, coinType, account, o_options, addrType) => {
    let options = {}
    if (o_options === undefined || o_options.network === undefined)
        options.network = global.DEFAULT_NETWORK
    else options = o_options


    let balance = Number(0)
    let addresses = []

    let newDerivationPath


    // read addresses from local storage if available
    let pathsAndAddresses = await getSavedAddresses(purpose)

    let newAddress

    if (pathsAndAddresses == undefined){
        pathsAndAddresses =   []
        let change = 0 // erste neue Addresse ist Empfangsadresse
        let index  = 0 // index der ersten neuen Empfangsadresse
        newDerivationPath = `${purpose}/${coinType}/${account}/${change}/${index}`
        newAddress = getAddress(xpub.derivePath(newDerivationPath).publicKey, options, addrType, newDerivationPath)
        await saveAddress(purpose, newDerivationPath, newAddress)
        pathsAndAddresses.push({"readDerivationPath": newDerivationPath, "readAddress": newAddress})
    }

    for (const entry of pathsAndAddresses) {
        addresses.push(entry.readAddress)
    }

    if (pathsAndAddresses.length < 2) {
        // create derivationPath for 1st change address
        let change = 1
        let index = 0
        newDerivationPath = `${purpose}/${coinType}/${account}/${change}/${index}`
        newAddress = getAddress(xpub.derivePath(newDerivationPath).publicKey, options, addrType, newDerivationPath)
        await saveAddress(purpose, newDerivationPath, newAddress)
        addresses.push(newAddress)
        pathsAndAddresses.push({"readDerivationPath": newDerivationPath, "readAddress": newAddress})
    }

    const addressesRet = await getBalanceOfAddresses(addresses, options)
    let retAddresses = addressesRet.addresses
    addresses = []

    // addresses von Electrum um derivationPath ergänzen
    for (let i = 0; i < retAddresses.length; i++) {
        for (let j = 0; j < pathsAndAddresses.length; j++) {
            if (retAddresses[i].address == pathsAndAddresses[j].readAddress) {
                let derivationPath = pathsAndAddresses[j].readDerivationPath
                let retAddr = retAddresses[i]
                retAddr["derivationPath"] = derivationPath
                addresses.push(retAddr)
            }
        }
    }


    // if all receiving addresses and all change addresses have transactions, create a new address for each type
    let unusedReceivingAddresses = []
    let unusedChangeAddresses = []
    let lastChangeDerivationPath
    let lastReceiveDerivationPath 

    // check if there are still unused receiving or change addresses
    for (let i = 0; i < addresses.length; i++) {
        let address = addresses[i]
        let derivationPath = address.derivationPath
        let change = (derivationPath.split("/")[4] == 1)
        if (!change  && address.transactions.length == 0){
            unusedReceivingAddresses.push(addresses[i])
        }else if (change && address.transactions.length == 0){
            unusedChangeAddresses.push(addresses[i])
        }
        change ? lastChangeDerivationPath = derivationPath : lastReceiveDerivationPath = derivationPath
    }

    // if there are no unused addresses left create new ones
    if (unusedReceivingAddresses.length == 0){
        let previousIndex  = lastReceiveDerivationPath.split("/")[5] 
        var lastIndex = lastReceiveDerivationPath.lastIndexOf('/');
        newDerivationPath = lastReceiveDerivationPath.substr(0, lastIndex) + "/" + ++previousIndex      
        newAddress = getAddress(xpub.derivePath(newDerivationPath).publicKey, options, addrType, newDerivationPath)
        await saveAddress(purpose, newDerivationPath, newAddress)
        let address = {}
        address["address"] = newAddress
        address["balance"] = 0
        address["derivationPath"] = newDerivationPath
        address["transactions"] = []
        addresses.push(address)

    } else if (unusedChangeAddresses.length == 0){
        let previousIndex  = lastChangeDerivationPath.split("/")[5] 
        var lastIndex = lastChangeDerivationPath.lastIndexOf('/');
        newDerivationPath = lastChangeDerivationPath.substr(0, lastIndex) + "/" + ++previousIndex      
        newAddress = getAddress(xpub.derivePath(newDerivationPath).publicKey, options, addrType, newDerivationPath)
        await saveAddress(purpose, newDerivationPath, newAddress)
        let address = {}
        address["address"] = newAddress
        address["balance"] = 0
        address["derivationPath"] = newDerivationPath
        address["transactions"] = []
        addresses.push(address)
    }

    balance = addressesRet.transactionCount > 0 ? Number(addressesRet.balance).toFixed(8) : 0

    return { balance: balance, addresses: addresses, transactionCount: addressesRet.transactionCount }
    }
