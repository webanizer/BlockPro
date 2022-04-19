import { publish, getNewPubKey, getKeyPair } from './publish.js'
import { createRequire } from "module"; // Bring in the ability to create the 'require' method
const require = createRequire(import.meta.url); // construct the require method
let bitcoin = require('bitcoinjs-lib');
import uint8ArrayToString from 'uint8arrays/to-string.js'
import { finalizeMultiSigTx } from './finalizeMultiSigTx.js';
import { signMultiSigTx, multiSigAddress } from "../doichainjs-lib/lib/createMultiSig.js"
import { s, receivedPubKeys, receivedSignatures, clearPubKeys, clearSignatures } from './sharedState.js';
import { checkCidList, compareCidListWithQueue, hashIsCorrect } from './checkCidList.js';
import createAndSendTransaction from '../doichainjs-lib/lib/createAndSendTransaction.js';
import sha256 from 'sha256';


// PubKey Listener für Rätsler und Signer
export async function listenForPubKeys() {
    // listen for publicKeys 

    let topicPubKeys = "pubkeys"
    await s.node.pubsub.subscribe(topicPubKeys)

    await s.node.pubsub.on(topicPubKeys, async (msg) => {
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
        }
    })
}


// Signatures listener für Signer
export async function listenForSignatures(topicSignatures) {
    await s.node.pubsub.on(topicSignatures, async (msg) => {

        if (s.rolle == "schläfer") {

            let data = await msg.data
            let message = uint8ArrayToString(data)

            if (message.includes('signature')) {
                message = message.split(' ')[1]
                console.log("Received Signature")
                console.log(`s.mOld = ${s.mOld}, s.nOld = ${s.nOld}`)
                const final = bitcoin.Psbt.fromBase64(message);
                receivedSignatures.push(final)
                if (receivedSignatures.length == s.mOld && s.mOld !== 1) {
                    console.log(" Letzte fehlende Signatur empfangen. Winner wird bezahlt")
                    s.rawtx = await finalizeMultiSigTx(s.psbtBaseText)
                    let topicReward = "rewardPayment"
                    let publishString = "rawtx " + s.rawtx
                    await publish(publishString, topicReward)

                    s.signWithCurrent = s.signWithNext
                    console.log("current sign with Winner: " + s.signWithCurrent)

                    // publish pubkey für die übernächste Runde 
                    let topicPubKeys = "pubkeys"
                    let pubKey = getNewPubKey()

                    s.signWithNext = s.lastDerPath
                    console.log("next derPath Winner: " + s.signWithNext)

                    publishString = "pubKey " + pubKey.toString('hex')
                    receivedPubKeys.push(pubKey)
                    await publish(publishString, topicPubKeys)
                    console.log("Published PUBKEY with derPath: " + s.lastDerPath)

                    s.rawtx = undefined
                    if (s.currentWinner !== s.id) {
                        s.rolle = "rätsler"
                        s.currentWinner = undefined
                        console.log("Gewinnerwechsel")

                        // don't listen for next block as rätsler
                        s.ecl.subscribe._events = {}
                        s.ecl.subscribe._eventsCount = 0
                        console.log("unsubscribed to next block")

                    } else {
                        s.rolle = "schläfer"
                    }
                }
            }
        }
    })
}


// Rätsler listener 
export async function rästlerListener(topicReward) {
    // listen for multiSigAddress and psbt that needs a Signature
    await s.node.pubsub.on(topicReward, async (msg) => {

        if (s.rolle == "rätsler") {
            let data = await msg.data
            let message = uint8ArrayToString(data)

            if (message.includes('multiSigAddress')) {

                if (receivedPubKeys.length !== 0) {
                    s.ohnePeersAktuelleRunde = false
                } else {
                    s.ohnePeersAktuelleRunde = true
                }

                s.ohnePeersLetzteRunde = s.ohnePeersAktuelleRunde
                clearPubKeys()
                console.log("cleared PUBKEYS")

                let topicPubKeys = "pubkeys"


                // Nur in 2. Runde. Wenn letzteRunde ohne Peers war
                if (s.zweiteRunde) {

                    // publish new Public Key
                    if (s.lastDerPath == undefined) {
                        s.lastDerPath = "0/1"
                    }

                    let pubKey = getNewPubKey()
                    receivedPubKeys.push(pubKey)

                    if (s.signWithNext == undefined) {
                        s.signWithCurrent = s.lastDerPath // "0/2"
                    } else {
                        s.signWithCurrent = s.signWithNext
                        s.zweiteRunde = false
                    }
                    let publishString = "pubKey " + pubKey.toString('hex')
                    await publish(publishString, topicPubKeys)
                    console.log("Published PUBKEY with derPath: " + s.lastDerPath)
                    s.signWithNext = s.lastDerPath
                }

                let p2shString = message.split('multiSigAddress ')[1]

                let parseJson = JSON.parse(p2shString)

                let parsedKeys = []
                parseJson.keys.forEach(function (key) {
                    key = Buffer.from(JSON.parse(key).data);
                    parsedKeys.push(key)
                })

                // reconstruct p2sh object for next transaction using original pubKeys
                s.nOld = parsedKeys.length
                s.mOld = Math.round(s.nOld * (2 / 3))

                // p2sh Objekt der vorigen Runde wird nachgebaut mit den empfangenen alten PublicKeys
                s.p2sh = multiSigAddress(s.network, parsedKeys);
                console.log("empfangene NextAddress: " + parseJson.multiSigAddress + " muss gleich sein wie rekonstruierte: " + s.p2sh.payment.address)

                if (s.ersteBezahlung == true) {
                    let destAddress = s.p2sh.payment.address
                    let amount = 50000  // Eintrittszahlung
                    let nameId
                    let nameValue

                    //await createAndSendTransaction(s.seed, s.password, amount, destAddress, s.wallet, nameId, nameValue)
                    console.log("Eintritt bezahlt")
                    s.ersteBezahlung = false
                }
            } else if (message.includes('cid ')) {
                // To Do: Plausibilitätsprüfung

            } else if (message.includes('psbt')) {
                console.log("received PSBT")
                message = message.split(' ')[1]

                let cidListValid = true//await checkCidList(message)

                // listen for signatures
                let topicSignatures = "signatures"
                await s.node.pubsub.subscribe(topicSignatures)

                if (cidListValid) {

                    let signedTx = await signMultiSigTx(message)

                    if (signedTx !== undefined) {
                        let publishString = "signature " + signedTx
                        await publish(publishString, topicSignatures)
                        console.log("Sent signature ")

                        if (s.signWithNext !== undefined) {
                            s.signWithCurrent = s.signWithNext
                        }

                        console.log("s.current = " + s.signWithCurrent)

                        // publish pubkey für die übernächste MultiSigAdresse
                        let pubKey = getNewPubKey()

                        // wenn in der nächsten Runde Gewinner, dann den eigenen pubKey zu receivedPubKeys fügen für nächste Runde
                        let topicPubKeys = "pubkeys"
                        publishString = "pubKey " + pubKey.toString('hex')
                        receivedPubKeys.push(pubKey)
                        await publish(publishString, topicPubKeys)
                        console.log("Published PUBKEY with derPath: " + s.lastDerPath)

                        s.signWithNext = s.lastDerPath

                        if (s.signWithCurrent == undefined) {
                            s.signWithCurrent == s.signWithNext
                        }


                        console.log("current: " + s.signWithCurrent)
                        console.log("next: " + s.signWithNext)

                    }
                }

            } else if (message.includes('rawtx')) {
                message = message.split(' ')[1]

                let decodedRawTx = await s.ecl.blockchain_transaction_get(message, 1)
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
                const mempool = await s.ecl.blockchain_scripthash_getMempool(reversedHash.toString("hex"))

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
                if (s.currentWinner == s.id) {
                    console.log("Gewinnerwechsel")
                    s.currentWinner = undefined
                    s.rolle = "schläfer"
                } else {
                    s.rolle = "rätsler"
                }
            }
        }
    })
}