import { publishMultiSigAddress, publishSignature, publishPsbt } from './publish.js'
import { createRequire } from "module"; // Bring in the ability to create the 'require' method
const require = createRequire(import.meta.url); // construct the require method
import { multiSigTx } from '../doichainjs-lib/lib/createMultiSig.js';
let bitcoin = require('bitcoinjs-lib');
import uint8ArrayToString from 'uint8arrays/to-string.js'
import { finalizeMultiSigTx } from './finalizeMultiSigTx.js';
import { signMultiSigTx } from "../doichainjs-lib/lib/createMultiSig.js"
import { createAndSendTransaction } from '../doichainjs-lib/lib/createAndSendTransaction.js';


export async function rewardWinner (node, topic2,receivedPubKeys, network, addrType, purpose, coinType, account, id, p2sh, receivedSignatures, m) {

    let psbtBaseText = await multiSigTx(node, topic2,receivedPubKeys, network, addrType, purpose, coinType, account, id, p2sh)
    await publishPsbt(node, topic2, psbtBaseText)
    let rawtx = await finalizeMultiSigTx(receivedSignatures, psbtBaseText, purpose, coinType, m)
}

export async function sendMultiSigAddress (node, topic2, network, receivedPubKeys, purpose, coinType, id, m) {

    let p2sh = await publishMultiSigAddress(node, topic2, network, receivedPubKeys, purpose, coinType, id)
    m = Math.round((receivedPubKeys.length)/2)
    return { p2sh, m }

}

export async function listenForSignatures(node, topic2, receivedPubKeys, receivedSignatures){
    // listen for multiSigAddress and psbt that needs a Signature
    await node.pubsub.on(topic2, async (msg) => {
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

export async function listenForMultiSig(node, topic2, ersteBezahlung, id){
            // listen for multiSigAddress and psbt that needs a Signature
            await node.pubsub.on(topic2, async (msg) => {

                let data = await msg.data
                let message = uint8ArrayToString(data)
        
                console.log('received message: ' + message)
        
                if (message.includes('multiSigAddress') && ersteBezahlung == true){
                    let destAddress = message.split(' ')[1]
                    let amount = 0.5
                    let nameId
                    let nameValue
                    await createAndSendTransaction(global.seed,global.password, amount, destAddress, global.wallet, nameId, nameValue)
                    ersteBezahlung = false
                } else if (message.includes('psbt')){
                    message = message.split(' ')[1]
                    let signedTx = await signMultiSigTx(purpose, coinType, psbt)
                    await publishSignature(node, topic2, signedTx, id)
                }
            })
}