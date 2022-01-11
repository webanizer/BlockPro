import { publishMultiSigAddress, publish, getKeyPair } from './publish.js'
// @ts-expect-error ts-migrate(2305) FIXME: Module '"module"' has no exported member 'createRe... Remove this comment to see the full error message
import { createRequire } from "module"; // Bring in the ability to create the 'require' method
// @ts-expect-error ts-migrate(2441) FIXME: Duplicate identifier 'require'. Compiler reserves ... Remove this comment to see the full error message
const require = createRequire(import.meta.url); // construct the require method
import { multiSigTx } from '../doichainjs-lib/lib/createMultiSig.js';
let bitcoin = require('bitcoinjs-lib');
import uint8ArrayToString from 'uint8arrays/to-string.js'
import { finalizeMultiSigTx } from './finalizeMultiSigTx.js';
import { signMultiSigTx } from "../doichainjs-lib/lib/createMultiSig.js"
import { s, receivedPubKeys, receivedSignatures, clearPubKeys } from './sharedState.js';
import createAndSendTransaction from '../doichainjs-lib/lib/createAndSendTransaction.js';


export async function rewardWinner(topic2: any, p2sh: any, cid: any, hash: any) {

    if (receivedPubKeys.length == 0) {
        // Get PubKey
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'basePath' does not exist on type '{}'.
        let keyPair = getKeyPair(`${s.basePath}/0/1`)
        // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'any' is not assignable to parame... Remove this comment to see the full error message
        receivedPubKeys.push(keyPair.publicKey)

        // @ts-expect-error ts-migrate(2339) FIXME: Property 'basePath' does not exist on type '{}'.
        let keyPair2 = getKeyPair(`${s.basePath}/0/2`)
        // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'any' is not assignable to parame... Remove this comment to see the full error message
        receivedPubKeys.push(keyPair2.publicKey)
    } else if (receivedPubKeys.length == 1) {
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'basePath' does not exist on type '{}'.
        let keyPair = getKeyPair(`${s.basePath}/0/2`)
        // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'any' is not assignable to parame... Remove this comment to see the full error message
        receivedPubKeys.push(keyPair.publicKey)
    }
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'network' does not exist on type '{}'.
    let data = await multiSigTx(s.network, s.addrType, s.purpose, s.coinType, s.account, s.id, p2sh, receivedPubKeys, s.hdkey, topic2, cid, hash)
    // await publishMultiSigAddress(nextMultiSigAddress)
    clearPubKeys()
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'nextMultiSigAddress' does not exist on t... Remove this comment to see the full error message
    s.nextMultiSigAddress = data.nextMultiSigAddress
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'psbtBaseText' does not exist on type '{}... Remove this comment to see the full error message
    s.psbtBaseText = data.psbtBaseText
    await publishMultiSigAddress(topic2, data.nextMultiSigAddress)

    let publishString = "psbt " + data.psbtBaseText
    await publish(publishString, topic2)

    // wait until all signatures are returned and reward was paid
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'ohnePeers' does not exist on type '{}'.
    if (s.ohnePeers == true) {
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'psbtBaseText' does not exist on type '{}... Remove this comment to see the full error message
        let rawtx = await finalizeMultiSigTx(s.psbtBaseText)
        return rawtx
    }

    // To Do: Austauschen durch warten bis zum nächsten Block
    setTimeout(function () {
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'm' does not exist on type '{}'.
        if (receivedSignatures >= s.m) {
            console.log("got enough signatures. Winner was rewarded")
        } else {
            // To Do: Handling was wenn nicht genug signaturen rechtzeitig zurück sind
            console.log("not enough signatures received")
        }
    }, 60000);

}

export async function sendMultiSigAddress(topic2: any) {

    // @ts-expect-error ts-migrate(2554) FIXME: Expected 2 arguments, but got 1.
    var p2sh = await publishMultiSigAddress(topic2)
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'm' does not exist on type '{}'.
    s.m = Math.round((receivedPubKeys.length) / 2)
    clearPubKeys()
    return p2sh
}

export async function listenForSignatures(topic2: any) {
    // listen for multiSigAddress and psbt that needs a Signature
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'node' does not exist on type '{}'.
    await s.node.pubsub.on(topic2, async (msg: any) => {
        let data = await msg.data
        let message = uint8ArrayToString(data)

        console.log('received message: ' + message)

        // Wenn Zählerstand
        if (message.includes('pubKey')) {
            message = message.split(' ')[1]
            // @ts-expect-error ts-migrate(2322) FIXME: Type 'Buffer' is not assignable to type 'string'.
            message = Buffer.from(message, 'hex');
            // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'string' is not assignable to par... Remove this comment to see the full error message
            receivedPubKeys.push(message)
        } else if (message.includes('signature')) {
            message = message.split(' ')[1]
            const final = bitcoin.Psbt.fromBase64(message);
            // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'any' is not assignable to parame... Remove this comment to see the full error message
            receivedSignatures.push(final)
            // @ts-expect-error ts-migrate(2339) FIXME: Property 'm' does not exist on type '{}'.
            if (receivedSignatures.length == s.m && s.m !== 1) {
                console.log(" Letzte fehlende Signatur empfangen. Winner wird bezahlt")
                // @ts-expect-error ts-migrate(2339) FIXME: Property 'psbtBaseText' does not exist on type '{}... Remove this comment to see the full error message
                let rawtx = await finalizeMultiSigTx(s.psbtBaseText)
            }
        }
    })
}

export async function listenForMultiSig(topic2: any, ersteBezahlung: any) {
    // listen for multiSigAddress and psbt that needs a Signature
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'node' does not exist on type '{}'.
    await s.node.pubsub.on(topic2, async (msg: any) => {

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

            // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'signedTx'.
            let publishString = "signature " + signedTx
            //await publish(publishString, topic2)
        }
    })
}