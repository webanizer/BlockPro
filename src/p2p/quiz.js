import { publish, getKeyPair } from './publish.js'
import uint8ArrayToString from 'uint8arrays/to-string.js'
import sha256 from 'sha256'
import determineWinner from './determineWinner.js'
import writeWinnerToLog from './writeWinnerToLog.js'
import { createRequire } from "module"; // Bring in the ability to create the 'require' method
const require = createRequire(import.meta.url); // construct the require method
import writePoEToDoichain from '../doichain/writePoEToDoichain.js'
import { returnUnusedAddress } from '../doichainjs-lib/lib/getAddress.js'
import smartMeterInit from "../doichain/smartMeterInit.js"
import { sendMultiSigAddress, rewardWinner, listenForMultiSig, listenForSignatures } from './reward.js';
import { s } from './sharedState.js';
const BitcoinCashZMQDecoder = require('bitcoincash-zmq-decoder');
const bitcoincashZmqDecoder = new BitcoinCashZMQDecoder("mainnet");
let bitcoin = require('bitcoinjs-lib');


// This function is for the Quizmaster who sets the hidden number
var iteration
var receivedNumbers = []
var m
var winnerPeerId
var randomNumber
var solutionNumber
var rolle
var cid

async function quiz(firstPeer) {

    let topic = "quizGuess"

    let topic2 = "rewardPayment"
    s.receivedZählerstand = []

    // subscribe to topic multiSig
    await s.node.pubsub.subscribe(topic2)

    const ecl = global.client //new ElectrumClient('itchy-jellyfish-89.doi.works', 50002, 'tls')

    await smartMeterInit(s.options, topic)

    iteration = 0
    let ersteBezahlung = true

    if (firstPeer == true)
        console.log('I am SEED now ' + s.id)

    // subscribe to topic Quiz
    await s.node.pubsub.subscribe(topic)

    s.ohnePeers = true

    // Listener for Quiz numbers and meter readings
    await s.node.pubsub.on(topic, async (msg) => {


        let data = await msg.data
        let message = uint8ArrayToString(data)

        console.log('received message: ' + message)

        // Wenn Zählerstand
        if (message.includes('Z ')) {
            message = message.split('Z ')[1]

            // To Do: Plausibilitätsprüfung der Daten bevor sie in die Queue aufgenommen werden
            s.receivedZählerstand.push(message)
        }
        else {
            // Wenn random number    
            let receivedPeerId = message.split(',')[0]
            if (!receivedNumbers.includes(`${receivedPeerId}`)) {
                receivedNumbers.push(message)
            }

            if (rolle == "rätsler") {
                raetsler()
                // To Do: publishPubkey an bessere Stelle setzen
                // Get PubKey
                let keyPair = getKeyPair(`${s.basePath}/0/1`)
                let pubKey = keyPair.publicKey
                let publishString = "pubKey " + pubKey.toString('hex')
                await publish(publishString, topic2)
                console.log("Published PUBKEY")
            }
        }

    })


    if (firstPeer == true) {
        // listen for messages
        rolle = "schläfer"
        s.ersteRunde = true
        startSleepThread(iteration)
    } else {
        rolle = "rätsler"
        console.log("NEUES RÄTSEL")
        s.ersteRunde = true
        await listenForMultiSig(topic2, ersteBezahlung, ecl)
    }

    async function raetsler() {
        // Wenn die Solution in den empfangenen Nachrichten ist, Zahl speichern
        for (var j = 0; j < receivedNumbers.length; j++) {
            let value = receivedNumbers[j].toString();
            if (value.includes('Solution')) {
                solutionNumber = value.split('Solution ')[1]
                break
            }
        }

        if (solutionNumber !== undefined && receivedNumbers.length > 1) {

            // auch die eigene Nummer muss in den array
            receivedNumbers.push(`${s.id}, ${randomNumber}`)

            winnerPeerId = await determineWinner(receivedNumbers, solutionNumber, s.id)

            randomNumber = undefined
            receivedNumbers = []

            console.log("Winner PeerId and Solution number: " + winnerPeerId + ", " + solutionNumber)

            if (winnerPeerId == s.id) {
                console.log('Ende von Runde. Nächste Runde ausgelöst')

                writeWinnerToLog(iteration, winnerPeerId, solutionNumber)
                console.log("Was Rätsler now last Signer")

                console.log("written Block ")
                console.log("von Rätsel neuer sleep Thread ")
                rolle = "schläfer"
                await listenForSignatures(topic2)
                ++iteration
                startSleepThread()
            } else {
                writeWinnerToLog(iteration, winnerPeerId, solutionNumber)

                console.log("written Block ")
                console.log("von Rätsel NEUES RÄTSEL")
                solutionNumber = undefined

                // generate a random number 
                randomNumber = Math.floor(Math.random() * 100000).toString();
                console.log('Random number: ' + randomNumber)

                rolle = "rätsler"
                ++iteration
                // Get PubKey
                let keyPair = getKeyPair(`${s.basePath}/0/1`)
                let pubKey = keyPair.publicKey
                let publishString = "pubKey " + pubKey.toString('hex')
                await publish(publishString, topic2)
                console.log("Published PUBKEY")

                publishString = (s.id + ', ' + randomNumber)
                await publish(publishString, topic)
            }
        } else if (s.ersteRunde !== undefined && solutionNumber !== undefined) {
            receivedNumbers = []

            writeWinnerToLog(iteration, winnerPeerId, solutionNumber)
            solutionNumber = undefined
            ++iteration
            console.log("written Block ")

            // generate a random number 
            randomNumber = Math.floor(Math.random() * 100000).toString();
            console.log('Random number: ' + randomNumber)

            rolle = "rätsler"

            let publishString = (s.id + ', ' + randomNumber)
            await publish(publishString, topic)
            s.ersteRunde = undefined
        }
    }

    async function startSleepThread() {

        // sleep for until next block is revealed
        console.log("neuer SLEEP Thread gestartet")

        await listenForSignatures(topic2)

        if (s.ersteRunde) {
            s.p2sh = await sendMultiSigAddress(topic2)
        }

        try {
            // To Do: Prüfen, ob in jeder Gewinnerrunde eine neue Verbindung erstellt wird
            await ecl.connect(
                "electrum-client-js", // optional client name
                "1.4.2" // optional protocol version
            )

            ecl.subscribe.on('blockchain.headers.subscribe', async (message) => {
                if (rolle == "schläfer") {

                    topic = "quizGuess"
                    let solution = "undefined"

                    let blockhash = bitcoin.Block.fromHex(message[0].hex);

                    // to do substring letzte 4 Stellen und von hex zu dez = solution
                    // blockhash = blockhash.hash.toString()
                    blockhash = blockhash.bits.toString()

                    let solutionHex = blockhash.slice(-4)

                    solution = 'Solution ' + solutionHex //parseInt(solutionHex, 16);

                    console.log("MESSAGES ", JSON.stringify(receivedNumbers))

                    // publish solution
                    let publishString = solution
                    await publish(publishString, topic)

                    console.log("Published Solution ", solution)

                    if (receivedNumbers.length > 1) {
                        solutionNumber = solution.split(' ')[1]
                        winnerPeerId = await determineWinner(receivedNumbers, solutionNumber, s.id)
                        solutionNumber = undefined
                    }

                    if (winnerPeerId == undefined && receivedNumbers.length < 2) {
                        console.log('KEINE MITSPIELER GEFUNDEN')
                        winnerPeerId = s.id
                    }

                    randomNumber = undefined
                    receivedNumbers = []

                    // Handle Zählerstand
                    if (s.eigeneCID !== undefined) {
                        s.receivedZählerstand.push(`${s.id}, ${s.eigeneCID}`)
                        s.eigeneCID = undefined
                    }

                    let uploadFile = undefined

                    uploadFile = JSON.stringify(s.receivedZählerstand.sort())
                    console.log("Array Zählerstand = ", uploadFile)

                    console.log('creating sha256 hash over data')
                    let hash = undefined
                    hash = sha256(uploadFile)
                    console.info('hash über cidListe', hash)

                    cid = await s.ipfs.add(uploadFile)

                    publishString = "cid " + cid.path
                    await publish(publishString, topic2)

                    cid = cid.path

                    console.log("List of CIDs to IPFS: ", cid)

                    console.log("Save CID and Hash to Doichain")

                    // Write Hash and CID to Doichain
                    // await writePoEToDoichain(cid, hash)

                    await rewardWinner(topic2, s.p2sh, cid, hash)

                    console.log("Executed in the worker thread");
                    console.log('Ende von Runde. Nächste Runde ausgelöst')


                    if (winnerPeerId == s.id) {
                        writeWinnerToLog(iteration, winnerPeerId, solution)
                        solution = undefined
                        cid = undefined
                        console.log("written Block ")
                        console.log("von sleep thread neuer SLEEP thread")
                        rolle = "schläfer"
                        ++iteration
                    } else {
                        writeWinnerToLog(iteration, winnerPeerId, solution)
                        solution = undefined
                        console.log("written Block ")
                        console.log("von sleep thread NEUES RÄTSEL ")

                        console.log("NEUES RÄTSEL")
                        // generate a random number 
                        randomNumber = Math.floor(Math.random() * 100000).toString();
                        console.log('Random number: ' + randomNumber)

                        rolle = "rätsler"
                        let ersteBezahlung = false
                        await listenForMultiSig(topic2, ersteBezahlung)
                        ++iteration
                        let publishString = (s.id + ', ' + randomNumber)
                        await publish(publishString, topic)
                    }
                }
            })
        } catch (err) {
            console.error(err);
        }
    }
}

export default quiz;