const bitcoin = require("bitcoinjs-lib")
import {getBalanceOfWallet} from "./getBalanceOfWallet";
import {getAddress} from "./getAddress";
import {getServerStatus} from "./getServerStatus";

export const createNewWallet = async (masterKey, walletIndex, email, o_options) => {
    let options = {}
    if(o_options===undefined || o_options.network===undefined)
        options.network=global.DEFAULT_NETWORK
    else options=o_options
    
    const chainIndex = 0
    const addressIndex = 0
    const baseDerivationPath = "m/"+walletIndex
    const derivationPath = chainIndex+"/"+addressIndex
    const walletDerivationPath = baseDerivationPath+"/"+derivationPath

    let xpub = bitcoin.bip32.fromBase58(masterKey.publicExtendedKey)
    const getBalanceOfWalletObj = await getBalanceOfWallet(xpub,walletDerivationPath,options)

    if(getBalanceOfWalletObj.addresses.length===0){
        const childKey = xpub.derivePath(walletDerivationPath)
        const address = getAddress(childKey.publicKey,options.network)
        getBalanceOfWalletObj.addresses = [{address:address}]
    }

    const status = await getServerStatus()
   // console.log('Doichain dApp version',status.data.version)

    const wallet = {}
    wallet.index=walletIndex
    wallet.publicExtendedKey = masterKey.publicExtendedKey
    wallet.isNew = (getBalanceOfWalletObj.transactionCount===0)
    wallet.network = network.name
    wallet.derivationPath = baseDerivationPath
    wallet.balance = getBalanceOfWalletObj.balance
    wallet.addresses = getBalanceOfWalletObj.addresses
    wallet.senderEmail = email
    wallet.serverVersion = status.data.version
    return wallet
}
