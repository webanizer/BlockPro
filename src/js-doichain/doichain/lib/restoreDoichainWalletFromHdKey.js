import {createNewWallet} from "./createNewWallet";

export const noEmailError = new TypeError('An email address is mandatory');

/**
 * 
 * @param {*} hdKey 
 * @param {*} email 
 * @param {*} options - attributes of this object: network and rescan
 */
export const restoreDoichainWalletFromHdKey = async (hdKey, o_options) => {
    let options = {}
    if(o_options===undefined || o_options.network===undefined)
        options.network=global.DEFAULT_NETWORK
    else options=o_options
    
    let walletIndex = 0
    let newWallet = false
    const wallets = []
    while(!newWallet){
        const wallet = await createNewWallet(hdKey,walletIndex,'email_'+walletIndex,options)
        if(!wallet.isNew){
            wallets.push(wallet)
            walletIndex++;
        } else newWallet = true
    }

    return wallets
}
