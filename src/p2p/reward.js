import { publishMultiSigAddress, publish, getKeyPair } from './publish.js'
import { createRequire } from "module"; // Bring in the ability to create the 'require' method
const require = createRequire(import.meta.url); // construct the require method
import { multiSigTx } from '../doichainjs-lib/lib/createMultiSig.js';
let bitcoin = require('bitcoinjs-lib');
import uint8ArrayToString from 'uint8arrays/to-string.js'
import { finalizeMultiSigTx } from './finalizeMultiSigTx.js';
import { signMultiSigTx } from "../doichainjs-lib/lib/createMultiSig.js"
import { s, receivedPubKeys, receivedSignatures, clearPubKeys, clearSignatures } from './sharedState.js';
import { checkCidList, compareCidListWithQueue, hashIsCorrect } from './checkCidList.js';
import createAndSendTransaction from '../doichainjs-lib/lib/createAndSendTransaction.js';
import sha256 from 'sha256';

export async function rewardWinner(topic2, p2sh, cid, hash) {

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
    let data = await multiSigTx(s.network, s.addrType, s.purpose, s.coinType, s.account, s.id, p2sh, receivedPubKeys, s.hdkey, topic2, cid, hash)

    clearPubKeys()

    s.nextMultiSigAddress = data.nextMultiSigAddress
    console.log("NEXT multiAddress: ", s.nextMultiSigAddress)
    s.psbtBaseText = data.psbtBaseText
    await publishMultiSigAddress(topic2, data.nextMultiSigAddress)

    // psbt nur dann publizieren, wenn peers pubKeys in der TX enthalten sind und sie signieren können
    if (!s.ohnePeersLetzteRunde) {
        let publishString = "psbt " + data.psbtBaseText
        await publish(publishString, topic2)
    }

    // wenn diese Runde pubKeys empfangen wurden müssen sie nächste Runde signieren
    s.ohnePeersLetzteRunde = s.ohnePeersAktuelleRunde

    clearSignatures()

    // if no peer pubkeys were included in the previous multiSigAddress finalize tx immediately and don't wait for signatures
    if (s.ohnePeersLetzteRunde) {
        s.rawtx = await finalizeMultiSigTx(s.psbtBaseText)
        let publishString = "rawtx " + s.rawtx
        await publish(publishString, topic2)
        return s.rawtx
    }
}

export async function sendMultiSigAddress(topic2) {

    var p2sh = await publishMultiSigAddress(topic2)
    s.m = Math.round((receivedPubKeys.length) / 2)
    s.n = receivedPubKeys.length
    // clearPubKeys()
    return p2sh
}

// Signer listener
export async function listenForSignatures(topic2) {
    // listen for publicKeys and psbt that needs a Signature
    await s.node.pubsub.on(topic2, async (msg) => {
        let data = await msg.data
        let message = uint8ArrayToString(data)

        console.log('received message: ' + message)

        // Wenn publicKeys
        if (message.includes('pubKey')) {
            message = message.split(' ')[1]
            message = Buffer.from(message, 'hex');
            let included = false

            // pubKey soll nur einmal in array aufgenommen werden, sonst ist m-of-n multisig falsch
            for (let i = 0; i < receivedPubKeys.length; i++) {
                if (Buffer.compare(receivedPubKeys[i], message) == 0) {
                    included = true
                }
            }
            if (!included) {
                receivedPubKeys.push(message)
            }
            if (!s.ersteRunde) {
                s.ohnePeersAktuelleRunde = false
            }
        } else if (message.includes('signature')) {
            message = message.split(' ')[1]
            console.log("Received Signature")
            const final = bitcoin.Psbt.fromBase64(message);
            receivedSignatures.push(final)
            if (receivedSignatures.length == s.m && s.m !== 1) {
                console.log(" Letzte fehlende Signatur empfangen. Winner wird bezahlt")
                s.rawtx = await finalizeMultiSigTx(s.psbtBaseText)
                let publishString = "rawtx " + s.rawtx
                await publish(publishString, publishString)
                s.rawtx = undefined
            }
        }
    })
}

// Rätsler listener 
export async function listenForMultiSig(topic2, ersteBezahlung, ecl) {
    // listen for multiSigAddress and psbt that needs a Signature
    await s.node.pubsub.on(topic2, async (msg) => {

        let data = await msg.data
        let message = uint8ArrayToString(data)

        console.log('received message: ' + message)

        if (message.includes('multiSigAddress') && ersteBezahlung == true) {
            clearPubKeys()
            let destAddress = message.split(' ')[1]
            let amount = 50000  // Eintrittszahlung
            let nameId
            let nameValue
            s.ohnePeersLetzteRunde = s.ohnePeersAktuelleRunde
            s.ohnePeersAktuelleRunde = true

            //await createAndSendTransaction(s.seed, s.password, amount, destAddress, s.wallet, nameId, nameValue)
            console.log("Eintritt bezahlt")
            ersteBezahlung = false
        } else if (message.includes('cid ')) {
            // To Do: Plausibilitätsprüfung

        } else if (message.includes('pubKey')) {
            message = message.split(' ')[1]
            message = Buffer.from(message, 'hex');
            let included = false

            // pubKey soll nur einmal in array aufgenommen werden, sonst ist m-of-n multisig falsch
            for (let i = 0; i < receivedPubKeys.length; i++) {
                if (Buffer.compare(receivedPubKeys[i], message) == 0) {
                    included = true
                }
            }
            if (!included) {
                receivedPubKeys.push(message)
            }
            if (!s.ersteRunde) {
                s.ohnePeersAktuelleRunde = false
            }
        } else if (message.includes('psbt')) {
            clearPubKeys()
            message = message.split(' ')[1]

            let cidListValid = true//await checkCidList(message)

            if (cidListValid) {
                let signedTx = await signMultiSigTx(s.purpose, s.coinType, message)
                if (signedTx !== undefined) {
                    let publishString = "signature " + signedTx
                    await publish(publishString, topic2)
                    console.log("Sent signature ")
                }
            }
        } else if (message.includes('rawtx')) {
            {
                {
                    message = message.split(' ')[1]

                    let decodedRawTx = await ecl.blockchain_transaction_get(message, 1)
                    let outputs = decodedRawTx.vout
                    let cidList
                    let savedHash
                    let gotConfirmations

                    if (decodedRawTx.confirmations > 0) {
                        gotConfirmations = true
                        console.log("tx has confirmations")
                    }

                    // Cid und hash aus decodedrawtx ausschneiden
                    for (let i = 0; i < outputs.length; i++) {
                        if (outputs[i].value == 0.01 && outputs[i].scriptPubKey.asm.indexOf("OP_NAME_DOI") !== -1) {
                            cidList = outputs[i].scriptPubKey.nameOp.name
                            savedHash = outputs[i].scriptPubKey.nameOp.value
                        }
                    }

                    let script = bitcoin.address.toOutputScript(s.wallet.addresses[0].address, s.network)

                    let hash = bitcoin.crypto.sha256(script)
                    let reversedHash = Buffer.from(hash.reverse())
                    const mempool = await ecl.blockchain_scripthash_getMempool(reversedHash.toString("hex"))

                    // check if received rawtx is in mempool
                    const found = mempool.find(element => element == decodedRawTx.hash);
                    let txInMempool = false
                    if (found !== undefined) {
                        console.log("Tx is in mempool")
                        txInMempool = true
                        // Queue darf gelöscht werden, wenn die CID Liste korrekt ist
                    } else {
                        console.log("Tx is not in mempool")
                        // Queue mit Cids darf nicht gelöscht werden
                    }

                    var winnerCidList = data
                    var matchingCids = compareCidListWithQueue(winnerCidList)

                    if (hashIsCorrect(matchingCids, winnerCidList, savedHash)) {
                        // Remove matching cids from Queue
                        for (let i = 0; i < s.receivedZählerstand.length; i++) {
                            var index = winnerCidList.indexOf(s.receivedZählerstand[i]);
                            if (index !== -1) {
                                s.receivedZählerstand.splice(i, 1)
                            }
                        }
                    }
                }
            }
        }
    })
}