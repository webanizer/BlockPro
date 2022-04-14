import { createRequire } from "module";
const require = createRequire(import.meta.url);
import { address } from "bitcoinjs-lib";
import { getBalanceOfAddresses } from "./getBalanceOfAddresses.js";
import { saveAddress, getSavedAddresses } from "./getOrSaveDerivationPath.js"
const bitcoin = require("bitcoinjs-lib")


export const getPathsOfAddresses = async (network, addrType, purpose, coinType, account, xpub, id) => {
    if (!network) network = global.DEFAULT_NETWORK

    let addresses = await getAddresses(network, addrType, purpose, coinType, account, xpub, id)
    let pathsAndAddresses = await getSavedAddresses(purpose, id)
    let addressesRet = await getBalanceOfAddresses(addresses, network)
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
    return [addresses, addressesRet]

}


export function getAddr (publicKey, network, addrType){
    let address
    if (addrType == "p2pkh") {
        var payment = bitcoin.payments.p2pkh({
            pubkey: publicKey,
            network: network.network,
        });
        address = payment.address
        console.log('legacy address ', address)

    } else if (addrType == "p2wpkh") {

        var payment = bitcoin.payments.p2wpkh({
            pubkey: publicKey,
            network: network.network
        })


        address = payment.address;
        console.log("p2wpkh address ", address)


    } else if (addrType == "p2sh") {
        // let pubkey = bitcoin.bip32.fromBase58(xpub, network.network).derivePath("m/84/1/0").publicKey

        var payment = bitcoin.payments.p2sh({
            redeem: bitcoin.payments.p2wpkh({
                pubkey: publicKey,
                network: network.network
            })
        })

        address = payment.address;
        console.log("p2sh address ", address)
    }

    return address
}

export async function getAddresses(network, addrType, purpose, coinType, account, xpub, id) {
    let addresses = []

    let newDerivationPath

    // read addresses from local storage if available
    let pathsAndAddresses = await getSavedAddresses(purpose,id)

    let newAddress

    if (pathsAndAddresses == undefined){
        pathsAndAddresses =   []
        let change = 0 // erste neue Addresse ist Empfangsadresse
        let index  = 0 // index der ersten neuen Empfangsadresse
        newDerivationPath = `${purpose}/${coinType}/${account}/${change}/${index}`
        newAddress = getAddr(xpub.derivePath(newDerivationPath).publicKey, network, addrType, newDerivationPath)
        await saveAddress(purpose, newDerivationPath, newAddress, id)
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
        newAddress = getAddr(xpub.derivePath(newDerivationPath).publicKey, network, addrType, newDerivationPath)
        await saveAddress(purpose, newDerivationPath, newAddress, id)
        addresses.push(newAddress)
        pathsAndAddresses.push({"readDerivationPath": newDerivationPath, "readAddress": newAddress})
    }
    return addresses 
}

export const returnUnusedAddress = async (network, addrType, purpose, coinType, account, receiving, id, xpub) => {

        let addresses = await getPathsOfAddresses(network, addrType, purpose, coinType, account, xpub, id)
        addresses = addresses[0]
        // if all receiving addresses and all change addresses have transactions, create a new address for each type
        let unusedReceivingAddresses = []
        let unusedChangeAddresses = []
        let lastChangeDerivationPath
        let lastReceiveDerivationPath 
        let unusedReceivingAddress = {}
        let unusedChangeAddress = {}
        let options = {}
        if(options===undefined || options.network===undefined){
            options.network = network
        }
    
        // check if there are still unused receiving or change addresses
        for (let i = 0; i < addresses.length; i++) {
            let address = addresses[i]
            let derivationPath = address.derivationPath
            let change = (derivationPath.split("/")[4] == 1)
            if (!change  && address.transactions.length == 0){
                unusedReceivingAddresses.push(addresses[i])
                unusedReceivingAddress = address
            }else if (change && address.transactions.length == 0){
                unusedChangeAddresses.push(addresses[i])
                unusedChangeAddress = address
            }
            change ? lastChangeDerivationPath = derivationPath : lastReceiveDerivationPath = derivationPath
        }
        
        
        // if there are no unused addresses left create new ones
        if (unusedReceivingAddresses.length == 0 ){
            let previousIndex  = lastReceiveDerivationPath.split("/")[5] 
            var lastIndex = lastReceiveDerivationPath.lastIndexOf('/');
            let newDerivationPath = lastReceiveDerivationPath.substr(0, lastIndex) + "/" + ++previousIndex      
            let newAddress = getAddr(xpub.derivePath(newDerivationPath).publicKey, options, addrType)
            console.log("SAVE ADDRESS receiving " + newAddress)
            await saveAddress(purpose, newDerivationPath, newAddress, id)
            unusedReceivingAddress.address = newAddress
    
        } else if (unusedChangeAddresses.length == 0){
            let previousIndex  = lastChangeDerivationPath.split("/")[5] 
            var lastIndex = lastChangeDerivationPath.lastIndexOf('/');
            let newDerivationPath = lastChangeDerivationPath.substr(0, lastIndex) + "/" + ++previousIndex      
            let newAddress = getAddr(xpub.derivePath(newDerivationPath).publicKey, options, addrType)
            console.log("SAVE ADDRESS change " + newAddress)
            await saveAddress(purpose, newDerivationPath, newAddress, id)
            unusedChangeAddress.address = newAddress
        }

        if (receiving){
            return unusedReceivingAddress
        }
        else{
            return unusedChangeAddress
        }
}