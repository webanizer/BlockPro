import { createRequire } from "module"; 
const require = createRequire(import.meta.url); 
const bitcoin = require("bitcoinjs-lib")
import { getBalanceOfWallet } from "./getBalanceOfWallet.js";


export const createNewWallet = async (hdkey, purpose, coinType, o_options, addrType, id) => {
    let options = {}
    if(o_options===undefined || o_options.network===undefined)
        options.network=global.DEFAULT_NETWORK
    else options=o_options
    
    const account = 0 
    const baseDerivationPath = purpose
    const derivationPath = coinType+"/"+account


    let xpub = bitcoin.bip32.fromBase58(hdkey.publicExtendedKey, options.network)

    const getBalanceOfWalletObj = await getBalanceOfWallet(xpub,purpose, coinType, account,options,addrType, id)

    //const status = await getServerStatus()
   // console.log('Doichain dApp version',status.data.version)

    const wallet = {}
    wallet.purpose=purpose
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
