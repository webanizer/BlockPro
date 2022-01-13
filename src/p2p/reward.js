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
import all from 'it-all'
import sha256 from 'sha256';

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

    // create and send multiSigTx 
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
        s.rawtx = await finalizeMultiSigTx(s.psbtBaseText)
        let publishString = "rawtx " + rawtx
        await publish(publishString, publishString)
        return rawtx
    }
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
                s.rawtx = await finalizeMultiSigTx(s.psbtBaseText)
                let publishString = "rawtx " + rawtx
                await publish(publishString, publishString)
                s.rawtx = undefined

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
        } else if (message.includes('cid ')) {


        }
        else if (message.includes('psbt')) {
            message = message.split(' ')[1]
            //let signedTx = await signMultiSigTx(s.purpose, s.coinType, message)

            // let publishString = "signature " + signedTx
            //await publish(publishString, topic2)
        } else if (message.includes('rawtx')) {
            {
                {
                    message = message.split(' ')[1]

                    let decodedRawTx = await ecl.blockchain_transaction_get(message, 1)

                    let script = bitcoin.address.toOutputScript(s.wallet.addresses[0], s.network)

                    let hash = bitcoin.crypto.sha256(script)
                    let reversedHash = Buffer.from(hash.reverse())
                    const mempool = await ecl.blockchain_scripthash_getMempool(reversedHash.toString("hex"))

                    // check if received rawtx is in mempool
                    const found = mempool.find(element => element == decodedRawTx.tx_hash);
                    let txInMempool = false
                    if (found !== undefined) {
                        console.log("Tx is in mempool")
                        txInMempool = true
                        // Queue darf gelöscht werden, wenn die CID Liste korrekt ist
                    } else {
                        console.log("Tx is not in mempool")
                        // Queue mit Cids darf nicht gelöscht werden
                    }

                    // delete all cids from queue that are in name_doi in mempool 
                    if (txInMempool) {

                        // To Do: CID Liste aus tx fischen

                        message = message.split(' ')[1]

                        // read content of cidList
                        var stream = s.ipfs.cat(message)
                        let data = []

                        for await (const chunk of stream) {
                            // chunks of data are returned as a Buffer, convert it back to a string
                            let message = chunk.toString()
                            message = JSON.parse(message)
                            data.push(message[0].split(", ")[1])
                        }

                        // pin the cidList to own repo
                        // To Do: Nicht alle müssen pinnen. Wie wählt man peers aus? Reward fürs pinnen? 
                        await s.ipfs.pin.add(message, true)

                        // returns all pinned data
                        //let pinList = await all(s.ipfs.pin.ls())

                        const pinset = await all(s.ipfs.pin.ls({
                            paths: message
                        }))

                        // Assure that current cid was pinned
                        if (!pinset) {
                            throw 'Cid was not pinned';
                        }
                        console.log(pinset)

                        // To Do: Cid Inhalt muss mit der Liste von empfangenen Cids abgeglichen werden
                        console.log("data ", data)
                        var winnerCidList = data
                        var matchingCids = []

                        console.log("receivedZählerstand ", s.receivedZählerstand)
                        console.log("winner Cid List ", winnerCidList)

                        // Compare winnerCidList and receivedZählerstand
                        for (let i = 0; i < s.receivedZählerstand.length; i++) {
                            var index = winnerCidList.indexOf(s.receivedZählerstand[i]);
                            if (index !== -1) {
                                matchingCids.push(s.receivedZählerstand[i])
                            } 
                        }

                        console.log("matching cids ", matchingCids)

                        s.receivedZählerstand = []

                        // To Do: Matching Cids sortieren und hash erzeugen
                        if (matchingCids.length == winnerCidList.length) {
                            matchingCids = matchingCids.sort()
                            s.sha256 = sha256(matchingCids)
                        }

                        // To Do: Wenn Signieren des Gewinners fehlschlägt, muss die backup liste gespeichert werden für die nächste Runde 
                    }
                }
            }
        }
    })
}