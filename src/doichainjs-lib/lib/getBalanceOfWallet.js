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
        let index = 0  // index der ersten neuen Empfangsadresse
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

    // TO DO nur eine Address in addresses und derivation path fehlt
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

        balance = addressesRet.transactionCount > 0 ? Number(addressesRet.balance).toFixed(8) : 0

        return { balance: balance, addresses: addresses, transactionCount: addressesRet.transactionCount }
    }
