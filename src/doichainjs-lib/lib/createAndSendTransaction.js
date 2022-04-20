import { createRequire } from "module"; 
const require = createRequire(import.meta.url); 
const bitcoin = require('bitcoinjs-lib')
import getUnspents from "./getUnspents.js"
import sendToAddress from "./sendToAddress.js"
import createHdKeyFromMnemonic from "./createHdKeyFromMnemonic.js"

const createAndSendTransaction = async (decryptedSeedPhrase,password,amount,destAddress,our_wallet,nameId,nameValue) => {
    const hdKey = createHdKeyFromMnemonic(decryptedSeedPhrase,password)
    console.log("sending " + amount + " schwartz to ", destAddress)

    //if we give the wallet object - take unspents from there otherewise try to use our_wallet as an arraylist already containing unspent tx
    let selectedInputs =  await getUnspents(our_wallet) //TODO don't take all unspents - only as much you need
    if(selectedInputs.length===0){ //TODO write test which tests this error
        const err = "sendAmount.broadcastingError.noInputs"
        throw err
    }

    //Collect addressKeys (privateKeys) from currently used inputs (to prepare signing the transaction)
    let addressKeys = []
    selectedInputs.forEach((ourUTXO) => {
        for (let i = 0; i < our_wallet.addresses.length; i++){
            if(our_wallet.addresses[i].address===ourUTXO.address.address){ 
                const addressDerivationPath = our_wallet.addresses[i].derivationPath
                const addressKey = hdKey.derive(addressDerivationPath)
                addressKeys.push(addressKey)
                break
            }
        }
    })
    console.log("addressKeys",addressKeys)

    let changeAddress //= our_wallet.addresses[0].address //TODO please implement getNewChangeAddress
    //1. get last change addresses from wallet and check if it has transactions
    let lastAddressIndex = 0
    for(let i = 0;i<our_wallet.addresses.length;i++){

        const addr = our_wallet.addresses[i]
        // console.log('checking change addresses with chainId '+(addr.derivationPath.split('/')[2])+'for transactions ',addr)
        //if(addr.derivationPath.split('/')[2] === 1 && addr.transactions.length===0)
        lastAddressIndex = Number(addr.derivationPath.split('/')[3])

        if(Number(addr.derivationPath.split('/')[2]) === 1 && addr.transactions.length===0){
            changeAddress = addr.address
            console.log('found change address in wallet without transactions',changeAddress)
           // break;
        }
    }

    //2. if there was no changeAddress found derive a new one
    if(changeAddress == undefined){
        const nextAddressIndex = lastAddressIndex+1
        console.log("couldn't find unused change address in wallet derivating next one with index",nextAddressIndex)
        const addressDerivationPath = 'm/'+activeWallet+'/1/'+nextAddressIndex
        const xpub = our_wallet.publicExtendedKey
        let childKey0FromXpub = bitcoin.bip32.fromBase58(xpub);
        changeAddress = bitcoin.payments.p2pkh(
            { pubkey: childKey0FromXpub.derivePath(addressDerivationPath).publicKey,
                network: global.DEFAULT_NETWORK}).address
        console.log('derivated change address',changeAddress)
    }

    const txResponse = await sendToAddress(addressKeys, destAddress, changeAddress, amount, selectedInputs,nameId,nameValue)     //chai.expect(addressesOfBob[0].address.substring(0,1)).to.not.be.uppercase
    // console.log("broadcast transaction", await client.blockchain_transaction_get(txResponse, 1))
    return txResponse
}

export default createAndSendTransaction
