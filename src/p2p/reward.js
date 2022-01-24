import { publishMultiSigAddress, publish, getKeyPair } from './publish.js'
import { createRequire } from "module"; // Bring in the ability to create the 'require' method
const require = createRequire(import.meta.url); // construct the require method
import { multiSigTx } from '../doichainjs-lib/lib/createMultiSig.js';
let bitcoin = require('bitcoinjs-lib');
import uint8ArrayToString from 'uint8arrays/to-string.js'
import { finalizeMultiSigTx } from './finalizeMultiSigTx.js';
import { signMultiSigTx } from "../doichainjs-lib/lib/createMultiSig.js"
import { s, receivedPubKeys, receivedSignatures, clearPubKeys } from './sharedState.js';
import { checkCidList, compareCidListWithQueue, hashIsCorrect } from './checkCidList.js';
import createAndSendTransaction from '../doichainjs-lib/lib/createAndSendTransaction.js';
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
        let publishString = "rawtx " + s.rawtx
        await publish(publishString, publishString)
        return s.rawtx
    }
}

export async function sendMultiSigAddress(topic2) {

    var p2sh = await publishMultiSigAddress(topic2)
    s.m = Math.round((receivedPubKeys.length) / 2)
    clearPubKeys()
    return p2sh
}

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
            receivedPubKeys.push(message)
        } else if (message.includes('signature')) {
            message = message.split(' ')[1]
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

            //await createAndSendTransaction(s.seed, s.password, amount, destAddress, s.wallet, nameId, nameValue)
            ersteBezahlung = false
        } else if (message.includes('cid ')) {


        }
        else if (message.includes('psbt')) {
            message = message.split(' ')[1]

            let cidListValid = await checkCidList(message)

            if (cidListValid) {
                let signedTx = await signMultiSigTx(s.purpose, s.coinType, message)

                let publishString = "signature " + signedTx
                await publish(publishString, topic2)
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