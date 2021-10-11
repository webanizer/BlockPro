const bitcoin = require('bitcoinjs-lib')
import {getBalanceOfWallet} from "./getBalanceOfWallet";

export const getBalance = async (activeWallet,wallets, o_options) => {
    let options = {}
    if(o_options===undefined || o_options.network===undefined)
        options.network=global.DEFAULT_NETWORK
    else options=o_options

    if(activeWallet===undefined || wallets===undefined || wallets.length===0) return
 
    let xPubKey = bitcoin.bip32.fromBase58(wallets[activeWallet].publicExtendedKey);
    const balanceObj = await getBalanceOfWallet(xPubKey,'m/'+activeWallet+'/0/0', options)
    //take all addresses from response and sort it into local addresses
    balanceObj.addresses.forEach( addr => {
        let found = false
        for(let i = 0;i<=wallets[activeWallet].addresses.length;i++){
            const thisAddress = wallets[activeWallet].addresses[i]
            if(thisAddress && thisAddress.address===addr.address){
                wallets[activeWallet].addresses[i] =  addr
                found=true
                break
            }
        }
        if(!found){
            wallets[activeWallet].addresses.push(addr)
        }
    })
    const tempWallets = wallets
    if(wallets[activeWallet].balance!==balanceObj.balance){
        const tempWallet = wallets[activeWallet]
        tempWallet.balance = balanceObj.balance
        tempWallets[activeWallet] = tempWallet
    }
    
    return {balance: balanceObj.balance, wallets: tempWallets}
}

export default getBalance