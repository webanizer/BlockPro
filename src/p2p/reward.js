import { publishMultiSigAddress, publishSignature, publishPsbt } from './publish.js'
import { createRequire } from "module"; // Bring in the ability to create the 'require' method
const require = createRequire(import.meta.url); // construct the require method
import { multiSigTx } from '../doichainjs-lib/lib/createMultiSig.js';
let bitcoin = require('bitcoinjs-lib');
import uint8ArrayToString from 'uint8arrays/to-string.js'
import { finalizeMultiSigTx } from './finalizeMultiSigTx.js';
import { signMultiSigTx } from "../doichainjs-lib/lib/createMultiSig.js"
import { s, receivedPubKeys, receivedSignatures, clearPubKeys, nextMultiSigAddress } from './sharedState.js';
import createAndSendTransaction from '../doichainjs-lib/lib/createAndSendTransaction.js';


export async function rewardWinner (topic2, p2sh) {

    let psbtBaseText = await multiSigTx(s.network, s.addrType, s.purpose, s.coinType, s.account, s.id, p2sh, receivedPubKeys, s.hdkey)
    await publishMultiSigAddress(nextMultiSigAddress)
    clearPubKeys()
    await publishPsbt(topic2, psbtBaseText)
    let rawtx = await finalizeMultiSigTx(psbtBaseText)
}

export async function sendMultiSigAddress (topic2) {

    var p2sh = await publishMultiSigAddress(topic2)
    s.m = Math.round((receivedPubKeys.length)/2)
    clearPubKeys()
    return p2sh
}

export async function listenForSignatures(topic2){
    // listen for multiSigAddress and psbt that needs a Signature
    await s.node.pubsub.on(topic2, async (msg) => {
        let data = await msg.data
        let message = uint8ArrayToString(data)

        console.log('received message: ' + message)

        // Wenn Zählerstand
        if (message.includes('pubKey')) {
            message = message.split(' ')[1]
            message =  Buffer.from(message, 'hex');
            receivedPubKeys.push(message)
        } else if (message.includes('signature')){
            message = message.split(' ')[1]
            const final = bitcoin.Psbt.fromBase64(message);
            receivedSignatures.push(final)
        }
    })
}

export async function listenForMultiSig(topic2, ersteBezahlung){
            // listen for multiSigAddress and psbt that needs a Signature
            await s.node.pubsub.on(topic2, async (msg) => {

                let data = await msg.data
                let message = uint8ArrayToString(data)
        
                console.log('received message: ' + message)
        
                if (message.includes('multiSigAddress') && ersteBezahlung == true){
                    let destAddress = message.split(' ')[1]
                    let amount = 50000  // Eintrittszahlung
                    let nameId
                    let nameValue

                    // To Do: Wieder auskommentieren
                    //await createAndSendTransaction(global.seed,global.password, amount, destAddress, global.wallet, nameId, nameValue)
                    ersteBezahlung = false
                } else if (message.includes('psbt')){
                    message = message.split(' ')[1]
                    let signedTx = await signMultiSigTx(s.purpose, s.coinType, psbt)
                    await publishSignature(topic2, signedTx)
                }
            })
}