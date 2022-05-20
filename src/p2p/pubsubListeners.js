import { publish, getNewPubKey, getKeyPair } from './publish.js'
import { createRequire } from "module"; // Bring in the ability to create the 'require' method
const require = createRequire(import.meta.url); // construct the require method
let bitcoin = require('bitcoinjs-lib');
import uint8ArrayToString from 'uint8arrays/to-string.js'
import { finalizeMultiSigTx } from './finalizeMultiSigTx.js';
import { signMultiSigTx, multiSigAddress } from "../doichainjs-lib/lib/createMultiSig.js"
import { s, receivedPubKeys, receivedSignatures, clearPubKeys, clearSignatures } from './sharedState.js';
import { checkCidList, readCid } from './checkCidList.js';
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

        if (s.rolle == "schläfer" && s.listenForSignatures) {

            let data = await msg.data
            let message = uint8ArrayToString(data)

            if (message.includes('signature')) {
                message = message.split(' ')[1]
                console.log("Received Signature")
                console.log(`s.mOld = ${s.mOld}, s.nOld = ${s.nOld}`)
                let requiredSignatures = s.mOld - 1
                const final = bitcoin.Psbt.fromBase64(message);
                receivedSignatures.push(final)
                if (receivedSignatures.length == requiredSignatures) {
                    s.listenForSignatures = false
                    console.log(" Letzte fehlende Signatur empfangen. Winner wird bezahlt")
                    s.rawtx = await finalizeMultiSigTx(s.psbtBaseText)

                    s.altePubKeys = s.neuePubKeys
                    s.neuePubKeys = []

                    // Remove matching cids from Queue
                    for (var i = 0; i < s.receivedZählerstand.length;) {
                        var index = s.cidList.indexOf(s.receivedZählerstand[i]);
                        if (index !== -1) {
                            console.log("removed from Zählerstand: " + s.receivedZählerstand[i])
                            s.receivedZählerstand.splice(i, 1)
                        }
                    }

                    console.log("Zählerstand nach Löschen und splice: " + s.receivedZählerstand)

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

                    if (s.currentWinner !== s.id) {
                        s.rolle = "rätsler"
                        s.currentWinner = undefined
                        console.log("Gewinnerwechsel")
                        s.ersteBezahlung = false
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
                    console.log("aktuelle Runde ohne peers")
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
                        s.ohnePeersLetzteRunde = true
                        s.ohnePeersAktuelleRunde = true
                    } else {
                        s.signWithCurrent = s.signWithNext
                        s.zweiteRunde = false
                        s.dritteRunde = true
                    }
                    let publishString = "pubKey " + pubKey.toString('hex')
                    await publish(publishString, topicPubKeys)
                    console.log("Published PUBKEY with derPath: " + s.lastDerPath)
                    s.signWithNext = s.lastDerPath
                    s.receivedZählerstand = []

                    s.altePubKeys = s.neuePubKeys
                    s.neuePubKeys = []
                }

                //await s.ipfs.pin.add(parseJson.keys.path, true)    
                message = message.split(" ")[1]

                // read content of cidList
                let data = await readCid(message)

                s.parsedKeys = []
                let receivedKeys = JSON.parse(data.keys)

                receivedKeys.forEach(function (key) {
                    key = Buffer.from(key, "hex");
                    s.parsedKeys.push(key)
                })

                if (s.neuePubKeys !== undefined) {
                    if (s.neuePubKeys.length > 0) {
                        console.log("Alte PublicKeys zur Signatur benutzen")
                        let currentDer = s.signWithCurrent.split("/")[1]
                        s.signWithCurrent = `0/${--currentDer}`
                        s.neuePubKeys = s.altePubKeys
                    }
                }

                reconstructP2sh(s.parsedKeys)
                s.neuePubKeys = s.parsedKeys

                console.log("empfangene NextAddress: " + data.multiSigAddress + " muss gleich sein wie rekonstruierte: " + s.p2sh.payment.address)

                if (s.ersteBezahlung == true) {
                    let destAddress = s.p2sh.payment.address
                    let amount = 50000  // Eintrittszahlung
                    let nameId
                    let nameValue

                    // await createAndSendTransaction(s.seed, s.password, amount, destAddress, s.wallet, nameId, nameValue)
                    console.log("Eintritt bezahlt")
                    s.ersteBezahlung = false
                }
            } else if (message.includes('cid ')) {
                // To Do: Plausibilitätsprüfung

            } else if (message.includes('psbt')) {
                console.log("received PSBT")
                message = message.split(' ')[1]

                if (s.eigeneCID !== undefined) {
                    s.receivedZählerstand.push(`${s.id}, ${s.eigeneCID}`)
                    s.eigeneCID = undefined
                }

                let cidListValid

                /* Zum Test, wenn nicht genug Signaturen vorhanden sind 
                if (s.vierteRunde !== undefined && process.env.PEER !== "./peerIds/id-1.json" && process.env.PEER !== "./peerIds/id-2.json") {
                    console.log("1")
                    if (s.vierteRunde == true) {
                        cidListValid = false
                        console.log("TEST cidList in Runde 4 abgelehnt")
                        console.log("cidList Valid? ", cidListValid)
                        s.vierteRunde = false
                    } else {
                        cidListValid = await checkCidList(message)
                        console.log("cidList Valid? ", cidListValid)
                    }
                } else {
                    cidListValid = await checkCidList(message)
                    console.log("cidList Valid? ", cidListValid)
                }

                    if (s.vierteRunde == undefined) {
                    s.vierteRunde = true
                    console.log("vierte Runde ")
                }
                */

                cidListValid = await checkCidList(message)
                console.log("cidList Valid? ", cidListValid)

                // listen for signatures
                let topicSignatures = "signatures"
                await s.node.pubsub.subscribe(topicSignatures)

                if (cidListValid) {

                    let signedTx = await signMultiSigTx(message)

                    if (signedTx !== undefined) {
                        let publishString = "signature " + signedTx
                        await publish(publishString, topicSignatures)
                        console.log("Sent signature ")
                    }
                }

                if (s.signWithNext !== undefined) {
                    s.signWithCurrent = s.signWithNext
                }

                console.log("s.current = " + s.signWithCurrent)

                // publish pubkey für die übernächste MultiSigAdresse
                let pubKey = getNewPubKey()

                // wenn in der nächsten Runde Gewinner, dann den eigenen pubKey zu receivedPubKeys fügen für nächste Runde
                let topicPubKeys = "pubkeys"
                let publishString = "pubKey " + pubKey.toString('hex')
                receivedPubKeys.push(pubKey)
                await publish(publishString, topicPubKeys)
                console.log("Published PUBKEY with derPath: " + s.lastDerPath)

                s.signWithNext = s.lastDerPath

                if (s.signWithCurrent == undefined) {
                    s.signWithCurrent == s.signWithNext
                }


                console.log("current: " + s.signWithCurrent)
                console.log("next: " + s.signWithNext)
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

                // read content of cidList
                let data = await readCid(cidList)

                var winnerCidList = data

                console.log("Zählerstand Länge nach comparing: ", s.receivedZählerstand)
                console.log("winnerCidList Länge nach comparing: ", winnerCidList.length)

                if (s.receivedZählerstand.length == 0) {
                    s.altePubKeys = s.neuePubKeys
                    s.neuePubKeys = []
                    console.log("Emptied neuePubKeys: ", s.neuePubKeys)
                    s.rawtx = message
                }

                // Remove matching cids from Queue
                for (var i = 0; i < s.receivedZählerstand.length;) {
                    var index = winnerCidList.indexOf(s.receivedZählerstand[i]);
                    if (index !== -1) {
                        console.log("removed from Zählerstand: " + s.receivedZählerstand[i])
                        s.receivedZählerstand.splice(i, 1)
                    }
                }
                
                s.altePubKeys = s.neuePubKeys
                s.neuePubKeys = []
                console.log("Emptied neuePubKeys: ", s.neuePubKeys)
                s.rawtx = message


                console.log("Zählerstand nach Löschen und splice: " + s.receivedZählerstand)

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

export function reconstructP2sh(publKeys) {
    // empfangene Keys für Transaktion verwenden
    s.nOld = publKeys.length
    s.mOld = Math.round(s.nOld * (2 / 3))

    // p2sh Objekt der vorigen Runde wird nachgebaut mit den empfangenen alten PublicKeys
    s.p2sh = multiSigAddress(s.network, publKeys);
}