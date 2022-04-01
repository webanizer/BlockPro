import { publish, getKeyPair } from './publish.js'
import { createRequire } from "module"; // Bring in the ability to create the 'require' method
const require = createRequire(import.meta.url); // construct the require method
import { multiSigTx } from '../doichainjs-lib/lib/createMultiSig.js';
import { finalizeMultiSigTx } from './finalizeMultiSigTx.js';
import { s, receivedPubKeys, clearPubKeys, clearSignatures } from './sharedState.js';
import { listenForSignatures } from './pubsubListeners.js';

export async function rewardWinner(topicReward, cid, hash) {

    if (receivedPubKeys.length == 0) {

        // waiting to receive public keys
        // Neue Runde: PubKeys, die in der aktuellen Runde empfangen wurden, signieren in der nächsten Runde    
        s.ohnePeersAktuelleRunde = true
        // Get PubKey
        let keyPair = getKeyPair(`${s.basePath}/0/1`)
        receivedPubKeys.push(keyPair.publicKey)

        let keyPair2 = getKeyPair(`${s.basePath}/0/2`)
        receivedPubKeys.push(keyPair2.publicKey)
    } else if (receivedPubKeys.length == 1) {
        let keyPair = getKeyPair(`${s.basePath}/0/2`)
        receivedPubKeys.push(keyPair.publicKey)
    }

    // create and send multiSigTx 
    if (s.ohnePeersAktuelleRunde) {
        clearPubKeys()
        if (s.lastDerPath3 == undefined) {
            s.lastDerPath3 = "0/3"
            let keyPair3 = getKeyPair(`${s.basePath}/${s.lastDerPath3}`)
            receivedPubKeys.push(keyPair3.publicKey)

            s.lastDerPath4 = "0/4"
            let keyPair4 = getKeyPair(`${s.basePath}/${s.lastDerPath4}`)
            receivedPubKeys.push(keyPair4.publicKey)
        } else {
            let nextDerPath3 = s.lastDerPath3.split("/")[1]
            s.lastDerPath3 = `${s.lastDerPath3.split("/")[0]}/${++nextDerPath3}`
            let keyPair3 = getKeyPair(`${s.basePath}/${s.lastDerPath3}`)
            receivedPubKeys.push(keyPair3.publicKey)

            let nextDerPath4 = s.lastDerPath4.split("/")[1]
            s.lastDerPath4 = `${s.lastDerPath4.split("/")[0]}/${++nextDerPath4}`
            let keyPair4 = getKeyPair(`${s.basePath}/${s.lastDerPath4}`)
            receivedPubKeys.push(keyPair4.publicKey)
        }
    } else {
        // eigenen PubKey dazufügen
        if (s.lastDerPath3 == undefined) {
            s.lastDerPath3 = "0/3"
            let keyPair3 = getKeyPair(`${s.basePath}/${s.lastDerPath3}`)
            receivedPubKeys.push(keyPair3.publicKey)
        } else {
            let nextDerPath3 = s.lastDerPath3.split("/")[1]
            s.lastDerPath3 = `${s.lastDerPath3.split("/")[0]}/${++nextDerPath3}`
            let keyPair3 = getKeyPair(`${s.basePath}/${s.lastDerPath3}`)
            receivedPubKeys.push(keyPair3.publicKey)
        }
    }

    let keys = []
    receivedPubKeys.forEach(function (key) {
        key = JSON.stringify(key);
        keys.push(key)
    });

    // Create raw reward transaction
    let data = await multiSigTx(s.network, s.addrType, s.purpose, s.coinType, s.account, s.id, s.p2sh, receivedPubKeys, s.hdkey, topicReward, cid, hash)

    clearPubKeys()

    s.nextMultiSigAddress = data.nextMultiSigAddress
    console.log("NEXT multiAddress: ", s.nextMultiSigAddress)

    let sendP2sh = {}
    sendP2sh.multiSigAddress = data.nextMultiSigAddress
    sendP2sh.keys = keys

    // publish multiSigAddress and pubKeys used to create it so next winner can reconstruct multiSig p2sh object for Transaction
    let sendJson = JSON.stringify(sendP2sh)

    let publishString = "multiSigAddress " + sendJson
    await publish(publishString, topicReward)

    s.psbtBaseText = data.psbtBaseText

    // psbt nur dann publizieren, wenn peers pubKeys in der TX enthalten sind und sie signieren können
    if (!s.ohnePeersLetzteRunde) {
        let publishString = "psbt " + data.psbtBaseText
        await publish(publishString, topicReward)
        clearSignatures()

        // listen for signatures
        let topicSignatures = "signatures"
        await s.node.pubsub.subscribe(topicSignatures)
        await listenForSignatures(topicSignatures)

    }

    // if no peer pubkeys were included in the previous multiSigAddress finalize tx immediately and don't wait for signatures
    if (s.ohnePeersLetzteRunde) {
        s.rawtx = await finalizeMultiSigTx(s.psbtBaseText)
        if (s.currentWinner !== s.id) {
            s.rolle = "rätsler"
        }
        let publishString = "rawtx " + s.rawtx
        await publish(publishString, topicReward)

        // wenn diese Runde pubKeys empfangen wurden müssen sie nächste Runde signieren
        s.ohnePeersLetzteRunde = s.ohnePeersAktuelleRunde
        return s.rawtx
    }

    // wenn diese Runde pubKeys empfangen wurden müssen sie nächste Runde signieren
    s.ohnePeersLetzteRunde = s.ohnePeersAktuelleRunde
}



