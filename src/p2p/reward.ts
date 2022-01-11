import { publishMultiSigAddress, publish, getKeyPair } from './publish.js'
import { createRequire } from "module"; // Bring in the ability to create the 'require' method
const require = createRequire(import.meta.url); // construct the require method
import { multiSigTx } from '../doichainjs-lib/lib/createMultiSig.js';
let bitcoin = require('bitcoinjs-lib');
import uint8ArrayToString from 'uint8arrays/to-string.js'
import { finalizeMultiSigTx } from './finalizeMultiSigTx.js';
import { signMultiSigTx } from "../doichainjs-lib/lib/createMultiSig.js"
import { s, receivedPubKeys, receivedSignatures, clearPubKeys } from './sharedState.js';
import createAndSendTransaction from '../doichainjs-lib/lib/createAndSendTransaction.js';


export async function rewardWinner(topic2, p2sh, cid, hash) {

    if (receivedPubKeys.length == 0) {
        // Get PubKey
        let keyPair = getKeyPair(`${s.basePath}/0/1`)
        receivedPubKeys.push(keyPair.publicKey)

        let keyPair2 = getKeyPair(`${s.basePath}/0/2`)
        receivedPubKeys.push(keyPair2.publicKey)
    } else if (receivedPubKeys.length == 1) {
        let keyPair = getKeyPair(`${s.basePath}/0/2`)
        receivedPubKeys.push(keyPair.publicKey)
    }
    let data = await multiSigTx(s.network, s.addrType, s.purpose, s.coinType, s.account, s.id, p2sh, receivedPubKeys, s.hdkey, topic2, cid, hash)
    // await publishMultiSigAddress(nextMultiSigAddress)
    clearPubKeys()
    s.nextMultiSigAddress = data.nextMultiSigAddress
    s.psbtBaseText = data.psbtBaseText
    await publishMultiSigAddress(topic2, data.nextMultiSigAddress)

    let publishString = "psbt " + data.psbtBaseText
    await publish(publishString, topic2)

    // wait until all signatures are returned and reward was paid
    if (s.ohnePeers == true) {
        let rawtx = await finalizeMultiSigTx(s.psbtBaseText)
        return rawtx
    }

    // To Do: Austauschen durch warten bis zum nächsten Block
    setTimeout(function () {
        if (receivedSignatures >= s.m) {
            console.log("got enough signatures. Winner was rewarded")
        } else {
            // To Do: Handling was wenn nicht genug signaturen rechtzeitig zurück sind
            console.log("not enough signatures received")
        }
    }, 60000);

}

export async function sendMultiSigAddress(topic2) {

    var p2sh = await publishMultiSigAddress(topic2)
    s.m = Math.round((receivedPubKeys.length) / 2)
    clearPubKeys()
    return p2sh
}

export async function listenForSignatures(topic2) {
    // listen for multiSigAddress and psbt that needs a Signature
    await s.node.pubsub.on(topic2, async (msg) => {
        let data = await msg.data
        let message = uint8ArrayToString(data)

        console.log('received message: ' + message)

        // Wenn Zählerstand
        if (message.includes('pubKey')) {
            message = message.split(' ')[1]
            message = Buffer.from(message, 'hex');
            receivedPubKeys.push(message)
        } else if (message.includes('signature')) {
            message = message.split(' ')[1]
            const final = bitcoin.Psbt.fromBase64(message);
            receivedSignatures.push(final)
            if (receivedSignatures.length == s.m && s.m !== 1) {
                console.log(" Letzte fehlende Signatur empfangen. Winner wird bezahlt")
                let rawtx = await finalizeMultiSigTx(s.psbtBaseText)
            }
        }
    })
}

export async function listenForMultiSig(topic2, ersteBezahlung) {
    // listen for multiSigAddress and psbt that needs a Signature
    await s.node.pubsub.on(topic2, async (msg) => {

        let data = await msg.data
        let message = uint8ArrayToString(data)

        console.log('received message: ' + message)

        if (message.includes('multiSigAddress') && ersteBezahlung == true) {
            let destAddress = message.split(' ')[1]
            let amount = 50000  // Eintrittszahlung
            let nameId
            let nameValue

            // To Do: Wieder auskommentieren
            //await createAndSendTransaction(global.seed,global.password, amount, destAddress, global.wallet, nameId, nameValue)
            ersteBezahlung = false
        } else if (message.includes('psbt')) {
            message = message.split(' ')[1]
            //let signedTx = await signMultiSigTx(s.purpose, s.coinType, message)

            let publishString = "signature " + signedTx
            //await publish(publishString, topic2)
        }
    })
}