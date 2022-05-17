import { publish, getKeyPair, getNewPubKey } from './publish.js'
import { createRequire } from "module"; // Bring in the ability to create the 'require' method
const require = createRequire(import.meta.url); // construct the require method
import { multiSigTx } from '../doichainjs-lib/lib/createMultiSig.js';
import { finalizeMultiSigTx } from './finalizeMultiSigTx.js';
import { s, receivedPubKeys, clearPubKeys, clearSignatures } from './sharedState.js';
import { reconstructP2sh } from './pubsubListeners.js';


export async function rewardWinner(topicReward, cid, hash) {

    if (receivedPubKeys.length == 0) {
        console.log("NO PUBKEYS")

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

    // For round 1 and 2 without peers
    if (s.ohnePeersAktuelleRunde) {
        if (s.lastDerPath == undefined) {
            clearPubKeys()
            s.lastDerPath = "0/3"
            let keyPair3 = getKeyPair(`${s.basePath}/${s.lastDerPath}`)
            receivedPubKeys.push(keyPair3.publicKey)

            // lastDerPath = "0/4"
            let pubKey = getNewPubKey(`${s.basePath}/${s.lastDerPath}`)
            receivedPubKeys.push(pubKey)
        }
    }

    let keys = []
    receivedPubKeys.forEach(function (key) {
        key = key.toString("hex")
        keys.push(key)
    });

    // Wenn die vorige Transaktion fehlgeschlagen ist (z.B. nicht genug Signaturen oder peers ausgetreten
    // muss die Balance von der vorigen MultiSigAdresse abgebucht werden)

    if (s.neuePubKeys !== undefined) {

        console.log("Length of s.neuePubkeys: ", s.neuePubKeys.length)
        if (s.neuePubKeys.length > 0) {
            console.log("Alte PublicKeys zur Rekonstruktion benutzt")
            reconstructP2sh(s.altePubKeys)
            let currentDer = s.signWithCurrent.split("/")[1]
            s.signWithCurrent = `0/${--currentDer}`
        }
    }

    console.log("Absender MultiSig Adresse = ", s.p2sh.payment.address)
    
    // Create raw reward transaction
    let data = await multiSigTx(s.network, s.addrType, s.purpose, s.coinType, s.account, s.id, s.p2sh, receivedPubKeys, s.hdkey, topicReward, cid, hash)
    s.neuePubKeys = receivedPubKeys

    console.log("Empfänger MultiSig Address = ", s.p2sh.payment.address)

    clearPubKeys()

    console.log("cleared PUBKEYS")

    s.nextMultiSigAddress = data.nextMultiSigAddress
    console.log("NEXT multiAddress: ", s.nextMultiSigAddress)

    let sendP2sh = {}
    sendP2sh.multiSigAddress = data.nextMultiSigAddress
    let keysString = JSON.stringify(keys)

    console.log("keysCid ", keysString)
    sendP2sh.keys = keysString

    // publish multiSigAddress and pubKeys used to create it so next winner can reconstruct multiSig p2sh object for Transaction
    let sendJson = JSON.stringify(sendP2sh)

    let keysAndMultiSigAddrCid = await s.ipfs.add(sendJson)


    let publishString = "multiSigAddress " + keysAndMultiSigAddrCid.path
    await publish(publishString, topicReward)

    s.psbtBaseText = data.psbtBaseText

    // psbt nur dann publizieren, wenn peers pubKeys in der TX enthalten sind und sie signieren können
    if (!s.ohnePeersLetzteRunde) {
        let publishString = "psbt " + data.psbtBaseText
        await publish(publishString, topicReward)
        clearSignatures()
    }

    // if no peer pubkeys were included in the previous multiSigAddress finalize tx immediately and don't wait for signatures
    if (s.ohnePeersLetzteRunde) {
        s.rawtx = await finalizeMultiSigTx(s.psbtBaseText)
        s.receivedZählerstand = []

        s.altePubKeys = s.neuePubKeys
        s.neuePubKeys = []

        if (s.currentWinner !== s.id) {
            s.rolle = "rätsler"
        }
        let publishString = "rawtx " + s.rawtx
        await publish(publishString, topicReward)

        // pubkey für die übernächste MultiSigAdresse
        if (s.signWithNext == undefined) {
            s.signWithCurrent = s.lastDerPath
        } else {
            s.signWithCurrent = s.signWithNext
        }

        let pubKey = getNewPubKey()

        receivedPubKeys.push(pubKey)
        s.signWithNext = s.lastDerPath

        // publish pubkey für die übernächste Runde 
        let topicPubKeys = "pubkeys"
        publishString = "pubKey " + pubKey.toString('hex')
        await publish(publishString, topicPubKeys)
        console.log("Published PUBKEY with derPath: " + s.lastDerPath)

        // wenn diese Runde pubKeys empfangen wurden müssen sie nächste Runde signieren
        s.ohnePeersLetzteRunde = s.ohnePeersAktuelleRunde
        return s.rawtx
    }

    // wenn diese Runde pubKeys empfangen wurden müssen sie nächste Runde signieren
    s.ohnePeersLetzteRunde = s.ohnePeersAktuelleRunde
}



