import { publishMultiSigAddress, publishPsbt } from './publish.js'
import { createRequire } from "module"; // Bring in the ability to create the 'require' method
const require = createRequire(import.meta.url); // construct the require method
import { multiSigTx } from '../doichainjs-lib/lib/createMultiSig.js';
let bitcoin = require('bitcoinjs-lib');
import uint8ArrayToString from 'uint8arrays/to-string.js'
import { finalizeMultiSigTx } from './finalizeMultiSigTx.js';


export async function rewardWinner (node, topic2,receivedPubKeys, network, addrType, purpose, coinType, account, id, p2sh, receivedSignatures, m) {

    let psbt = await multiSigTx(node, topic2,receivedPubKeys, network, addrType, purpose, coinType, account, id, p2sh)
    await publishPsbt(node, topic2, psbt)
    await finalizeMultiSigTx(receivedSignatures, psbt, purpose, coinType, m)
}

export async function sendMultiSigAddress (node, topic2, network, receivedPubKeys, purpose, coinType, id, m) {

    let p2sh = await publishMultiSigAddress(node, topic2, network, receivedPubKeys, purpose, coinType, id)
    m = Math.round((receivedPubKeys.length)/2)
    receivedPubKeys = []
    return { p2sh, m }

}

export async function listenToTopic2(node, topic2, receivedPubKeys, receivedSignatures){
    // listen for multiSigAddress and psbt that needs a Signature
    await node.pubsub.on(topic2, async (msg) => {
        let data = await msg.data
        let message = uint8ArrayToString(data)

        console.log('received message: ' + message)

        // Wenn Zählerstand
        if (message.includes('pubkey')) {
            message = message.split(' ')[1]
            receivedPubKeys.push(message)
        } else if (message.includes('signature')){
            message = message.split(' ')[1]
            const final = bitcoin.Psbt.fromBase64(message);
            receivedSignatures.push(final)
        }
    })
}