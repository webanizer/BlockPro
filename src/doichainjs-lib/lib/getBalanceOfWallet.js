import { createRequire } from "module";
const require = createRequire(import.meta.url);
import { getAddress } from "./getAddress.js";
import { getBalanceOfAddresses } from "./getBalanceOfAddresses.js";
import { saveAddress, getSavedAddresses } from "./getOrSaveDerivationPath.js"


export const getBalanceOfWallet = async (xpub, derivationPath, o_options, addrType) => {
    let options = {}
    if (o_options === undefined || o_options.network === undefined)
        options.network = global.DEFAULT_NETWORK
    else options = o_options
    const derivationElements = derivationPath.split('/')

    let walletNo
    let chainsNo
    let addressNo
    if (derivationElements.length === 2) {
        chainsNo = Number(derivationElements[0])
        addressNo = Number(derivationElements[1])
    } else {
        walletNo = Number(derivationElements[1])
        chainsNo = Number(derivationElements[2])
        addressNo = Number(derivationElements[3])
    }

    let balance = Number(0)
    let addresses = []
    let transactionCount = 0

    let newDerivationPath


    // read addresses from local storage if available
    let pathsAndAddresses = await getSavedAddresses(walletNo)

    for (const entry of pathsAndAddresses) {
        addresses.push(entry.readAddress)
        let derParts = entry.readDerivationPath.split("/")
        newDerivationPath = `m/${walletNo}/${chainsNo}/${++derParts[3]}`
    }

    let newAddress

    if (pathsAndAddresses.length < 2) {
        newAddress = getAddress((derivationElements.length !== 2) ? xpub.derivePath(newDerivationPath).publicKey : xpub.publicKey, options, addrType, newDerivationPath)
        await saveAddress(walletNo, chainsNo, newDerivationPath, newAddress)
        addresses.push(newAddress)
    }

    const addressesRet = await getBalanceOfAddresses(addresses, options)
    let retAddresses = addressesRet.addresses
    addresses = []
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
        derivationPath = newDerivationPath


        return { balance: balance, addresses: addresses, transactionCount: addressesRet.transactionCount }
    }
