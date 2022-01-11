// @ts-expect-error ts-migrate(2305) FIXME: Module '"module"' has no exported member 'createRe... Remove this comment to see the full error message
import { createRequire } from "module";
// @ts-expect-error ts-migrate(2441) FIXME: Duplicate identifier 'require'. Compiler reserves ... Remove this comment to see the full error message
const require = createRequire(import.meta.url);
import { address } from "bitcoinjs-lib";
import { getBalanceOfAddresses } from "./getBalanceOfAddresses.js";
import { saveAddress, getSavedAddresses } from "./getOrSaveDerivationPath.js"
const bitcoin = require("bitcoinjs-lib")


export const getPathsOfAddresses = async (network: any, addrType: any, purpose: any, coinType: any, account: any, xpub: any, id: any) => {
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'DEFAULT_NETWORK' does not exist on type ... Remove this comment to see the full error message
    if (!network) network = global.DEFAULT_NETWORK

    let addresses = await getAddresses(network, addrType, purpose, coinType, account, xpub, id)
    let pathsAndAddresses = await getSavedAddresses(purpose, id)
    let addressesRet = await getBalanceOfAddresses(addresses, network)
    let retAddresses = addressesRet.addresses
    addresses = []

    // addresses von Electrum um derivationPath ergänzen
    for (let i = 0; i < retAddresses.length; i++) {
        // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
        for (let j = 0; j < pathsAndAddresses.length; j++) {
            // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
            if (retAddresses[i].address == pathsAndAddresses[j].readAddress) {
                // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
                let derivationPath = pathsAndAddresses[j].readDerivationPath
                let retAddr = retAddresses[i]
                // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
                retAddr["derivationPath"] = derivationPath
                addresses.push(retAddr)
            }
        }
    }
    return [addresses, addressesRet]

}


export function getAddr (publicKey: any, network: any, addrType: any){
    let address
    if (addrType == "legacy") {
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

export async function getAddresses(network: any, addrType: any, purpose: any, coinType: any, account: any, xpub: any, id: any) {
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
        // @ts-expect-error ts-migrate(2554) FIXME: Expected 3 arguments, but got 4.
        newAddress = getAddr(xpub.derivePath(newDerivationPath).publicKey, network, addrType, newDerivationPath)
        await saveAddress(purpose, newDerivationPath, newAddress, id)
        // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
        pathsAndAddresses.push({"readDerivationPath": newDerivationPath, "readAddress": newAddress})
    }

    // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
    for (const entry of pathsAndAddresses) {
        addresses.push(entry.readAddress)
    }

    // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
    if (pathsAndAddresses.length < 2) {
        // create derivationPath for 1st change address
        let change = 1
        let index = 0
        newDerivationPath = `${purpose}/${coinType}/${account}/${change}/${index}`
        // @ts-expect-error ts-migrate(2554) FIXME: Expected 3 arguments, but got 4.
        newAddress = getAddr(xpub.derivePath(newDerivationPath).publicKey, network, addrType, newDerivationPath)
        await saveAddress(purpose, newDerivationPath, newAddress, id)
        addresses.push(newAddress)
        // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
        pathsAndAddresses.push({"readDerivationPath": newDerivationPath, "readAddress": newAddress})
    }
    return addresses 
}

export const returnUnusedAddress = async (network: any, addrType: any, purpose: any, coinType: any, account: any, receiving: any, id: any, xpub: any) => {

        let addresses = await getPathsOfAddresses(network, addrType, purpose, coinType, account, xpub, id)
        // @ts-expect-error ts-migrate(2322) FIXME: Type 'any[] | { transactionCount: number; addresse... Remove this comment to see the full error message
        addresses = addresses[0]
        // if all receiving addresses and all change addresses have transactions, create a new address for each type
        let unusedReceivingAddresses = []
        let unusedChangeAddresses = []
        let lastChangeDerivationPath
        let lastReceiveDerivationPath 
        let unusedReceivingAddress
        let unusedChangeAddress 
    
        // check if there are still unused receiving or change addresses
        for (let i = 0; i < addresses.length; i++) {
            let address = addresses[i]
            // @ts-expect-error ts-migrate(2339) FIXME: Property 'derivationPath' does not exist on type '... Remove this comment to see the full error message
            let derivationPath = address.derivationPath
            let change = (derivationPath.split("/")[4] == 1)
            // @ts-expect-error ts-migrate(2339) FIXME: Property 'transactions' does not exist on type 'an... Remove this comment to see the full error message
            if (!change  && address.transactions.length == 0){
                unusedReceivingAddresses.push(addresses[i])
                unusedReceivingAddress = address
            // @ts-expect-error ts-migrate(2339) FIXME: Property 'transactions' does not exist on type 'an... Remove this comment to see the full error message
            }else if (change && address.transactions.length == 0){
                unusedChangeAddresses.push(addresses[i])
                unusedChangeAddress = address
            }
            change ? lastChangeDerivationPath = derivationPath : lastReceiveDerivationPath = derivationPath
        }
    
        // if there are no unused addresses left create new ones
        if (unusedReceivingAddresses.length == 0){
            let previousIndex  = lastReceiveDerivationPath.split("/")[5] 
            var lastIndex = lastReceiveDerivationPath.lastIndexOf('/');
            // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'newDerivationPath'.
            newDerivationPath = lastReceiveDerivationPath.substr(0, lastIndex) + "/" + ++previousIndex      
            // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'newAddress'.
            newAddress = getAddress(xpub.derivePath(newDerivationPath).publicKey, options, addrType, newDerivationPath)
            // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'newDerivationPath'.
            await saveAddress(purpose, newDerivationPath, newAddress, id)
            // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'newAddress'.
            unusedReceivingAddress = newAddress
    
        } else if (unusedChangeAddresses.length == 0){
            let previousIndex  = lastChangeDerivationPath.split("/")[5] 
            var lastIndex = lastChangeDerivationPath.lastIndexOf('/');
            // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'newDerivationPath'.
            newDerivationPath = lastChangeDerivationPath.substr(0, lastIndex) + "/" + ++previousIndex      
            // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'newAddress'.
            newAddress = getAddress(xpub.derivePath(newDerivationPath).publicKey, options, addrType, newDerivationPath)
            // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'newDerivationPath'.
            await saveAddress(purpose, newDerivationPath, newAddress, id)
            // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'newAddress'.
            unusedChangeAddress = newAddress
        }

        if (receiving){
            return unusedReceivingAddress
        }
        else{
            return unusedChangeAddress
        }
}