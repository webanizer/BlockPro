// @ts-expect-error ts-migrate(2305) FIXME: Module '"module"' has no exported member 'createRe... Remove this comment to see the full error message
import { createRequire } from "module"; 
// @ts-expect-error ts-migrate(2441) FIXME: Duplicate identifier 'require'. Compiler reserves ... Remove this comment to see the full error message
const require = createRequire(import.meta.url); 
const bitcoin = require("bitcoinjs-lib")
import { getBalanceOfWallet } from "./getBalanceOfWallet.js";


export const createNewWallet = async (hdkey: any, purpose: any, coinType: any, o_options: any, addrType: any, id: any) => {
    let options = {}
    if(o_options===undefined || o_options.network===undefined)
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'network' does not exist on type '{}'.
        options.network=global.DEFAULT_NETWORK
    else options=o_options
    
    const account = 0 
    const baseDerivationPath = purpose
    const derivationPath = coinType+"/"+account


    // @ts-expect-error ts-migrate(2339) FIXME: Property 'network' does not exist on type '{}'.
    let xpub = bitcoin.bip32.fromBase58(hdkey.publicExtendedKey, options.network)

    const getBalanceOfWalletObj = await getBalanceOfWallet(xpub,purpose, coinType, account,options,addrType, id)

    //const status = await getServerStatus()
   // console.log('Doichain dApp version',status.data.version)

    const wallet = {}
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'purpose' does not exist on type '{}'.
    wallet.purpose=purpose
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'publicExtendedKey' does not exist on typ... Remove this comment to see the full error message
    wallet.publicExtendedKey = hdkey.publicExtendedKey
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'isNew' does not exist on type '{}'.
    wallet.isNew = (getBalanceOfWalletObj.transactionCount===0)
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'network' does not exist on type '{}'.
    wallet.network = global.DEFAULT_NETWORK.name
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'derivationPath' does not exist on type '... Remove this comment to see the full error message
    wallet.derivationPath = baseDerivationPath
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'balance' does not exist on type '{}'.
    wallet.balance = getBalanceOfWalletObj.balance
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'addresses' does not exist on type '{}'.
    wallet.addresses = getBalanceOfWalletObj.addresses
    //wallet.senderEmail = email
    //wallet.serverVersion = status.data.version
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'balance' does not exist on type '{}'.
    console.log("new wallet created with balance: ", wallet.balance)
    return wallet
}
