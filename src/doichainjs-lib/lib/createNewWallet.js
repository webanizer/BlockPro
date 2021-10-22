import { createRequire } from "module"; 
const require = createRequire(import.meta.url); 
const bitcoin = require("bitcoinjs-lib")
import { getBalanceOfWallet } from "./getBalanceOfWallet.js";
import {getAddress} from "./getAddress.js";

export const createNewWallet = async (hdkey, walletIndex, o_options, addrType) => {
    let options = {}
    if(o_options===undefined || o_options.network===undefined)
        options.network=global.DEFAULT_NETWORK
    else options=o_options
    
    const chainIndex = 1
    const addressIndex = 0
    const baseDerivationPath = "m/"+walletIndex
    const derivationPath = chainIndex+"/"+addressIndex
    const walletDerivationPath = baseDerivationPath+"/"+derivationPath

    let xpub = bitcoin.bip32.fromBase58(hdkey.publicExtendedKey, options.network)

    const getBalanceOfWalletObj = await getBalanceOfWallet(xpub,walletDerivationPath,options,addrType)

    if(getBalanceOfWalletObj.addresses.length===0){
        const childKey = xpub.derivePath(walletDerivationPath)
        const address = getAddress(childKey.publicKey,options.network, addrType)
        getBalanceOfWalletObj.addresses = [{address:address}]
    }

    //const status = await getServerStatus()
   // console.log('Doichain dApp version',status.data.version)

    const wallet = {}
    wallet.index=walletIndex
    wallet.publicExtendedKey = hdkey.publicExtendedKey
    wallet.isNew = (getBalanceOfWalletObj.transactionCount===0)
    wallet.network = global.DEFAULT_NETWORK.name
    wallet.derivationPath = baseDerivationPath
    wallet.balance = getBalanceOfWalletObj.balance
    wallet.addresses = getBalanceOfWalletObj.addresses
    //wallet.senderEmail = email
    //wallet.serverVersion = status.data.version
    console.log("new wallet created with balance: ", wallet.balance)
    return wallet
}
