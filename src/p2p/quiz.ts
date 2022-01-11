import { publish, getKeyPair } from './publish.js'
import uint8ArrayToString from 'uint8arrays/to-string.js'
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'sha2... Remove this comment to see the full error message
import sha256 from 'sha256'
import determineWinner from './determineWinner.js'
import writeWinnerToLog from './writeWinnerToLog.js'
// @ts-expect-error ts-migrate(2305) FIXME: Module '"module"' has no exported member 'createRe... Remove this comment to see the full error message
import { createRequire } from "module"; // Bring in the ability to create the 'require' method
// @ts-expect-error ts-migrate(2441) FIXME: Duplicate identifier 'require'. Compiler reserves ... Remove this comment to see the full error message
const require = createRequire(import.meta.url); // construct the require method
import writePoEToDoichain from '../doichain/writePoEToDoichain.js'
import smartMeterInit from "../doichain/smartMeterInit.js"
import { sendMultiSigAddress, rewardWinner, listenForMultiSig, listenForSignatures } from './reward.js';
import { s } from './sharedState.js';
const BitcoinCashZMQDecoder = require('bitcoincash-zmq-decoder');
const bitcoincashZmqDecoder = new BitcoinCashZMQDecoder("mainnet");
let bitcoin = require('bitcoinjs-lib');



// This function is for the Quizmaster who sets the hidden number
var iteration: any
var receivedNumbers: any = []
var receivedZählerstand: any = []
var m
var winnerPeerId: any
var randomNumber: any
var solutionNumber: any
var ersteRunde: any
var rolle: any
var cid

async function quiz(firstPeer: any) {

    let topic = "quizGuess"

    let topic2 = "rewardPayment"

    // subscribe to topic multiSig
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'node' does not exist on type '{}'.
    await s.node.pubsub.subscribe(topic2)

    // @ts-expect-error ts-migrate(2339) FIXME: Property 'client' does not exist on type 'Global'.
    const ecl = global.client //new ElectrumClient('itchy-jellyfish-89.doi.works', 50002, 'tls')

    // @ts-expect-error ts-migrate(2552) FIXME: Cannot find name 'options'. Did you mean 'Option'?
    await smartMeterInit(options, topic)

    iteration = 0
    let ersteBezahlung = true

    if (firstPeer == true)
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'id' does not exist on type '{}'.
        console.log('I am SEED now ' + s.id)

    // subscribe to topic Quiz
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'node' does not exist on type '{}'.
    await s.node.pubsub.subscribe(topic)

    // Listener for Quiz numbers and meter readings
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'node' does not exist on type '{}'.
    await s.node.pubsub.on(topic, async (msg: any) => {


        let data = await msg.data
        let message = uint8ArrayToString(data)

        console.log('received message: ' + message)

        // Wenn Zählerstand
        if (message.includes('Z ')) {
            message = message.split('Z ')[1]

            receivedZählerstand.push(message)
        } else if (message.includes('cid ')) {
            message = message.split(' ')[1]

            // read content of cidList
            // @ts-expect-error ts-migrate(2339) FIXME: Property 'ipfs' does not exist on type '{}'.
            var stream = s.ipfs.cat(message)
            let data = ''

            for await (const chunk of stream) {
                // chunks of data are returned as a Buffer, convert it back to a string
                data += chunk.toString()
            }

            // pin the cidList to own repo
            // To Do: Nicht alle müssen pinnen. Wie wählt man peers aus? Reward fürs pinnen? 
            // @ts-expect-error ts-migrate(2339) FIXME: Property 'ipfs' does not exist on type '{}'.
            s.ipfs.pin.add(message, true)
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
                // @ts-expect-error ts-migrate(2339) FIXME: Property 'basePath' does not exist on type '{}'.
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
        // @ts-expect-error ts-migrate(2554) FIXME: Expected 0 arguments, but got 1.
        startSleepThread(iteration)
    } else {
        rolle = "rätsler"
        console.log("NEUES RÄTSEL")
        ersteRunde = true
        await listenForMultiSig(topic2, ersteBezahlung)
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
            // @ts-expect-error ts-migrate(2339) FIXME: Property 'id' does not exist on type '{}'.
            receivedNumbers.push(`${s.id}, ${randomNumber}`)

            // @ts-expect-error ts-migrate(2554) FIXME: Expected 2 arguments, but got 3.
            winnerPeerId = await determineWinner(receivedNumbers, solutionNumber, s.id)

            randomNumber = undefined
            receivedNumbers = []

            console.log("Winner PeerId and Solution number: " + winnerPeerId + ", " + solutionNumber)
            receivedZählerstand = []

            // @ts-expect-error ts-migrate(2339) FIXME: Property 'id' does not exist on type '{}'.
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
                // @ts-expect-error ts-migrate(2339) FIXME: Property 'basePath' does not exist on type '{}'.
                let keyPair = getKeyPair(`${s.basePath}/0/1`)
                let pubKey = keyPair.publicKey
                let publishString = "pubKey " + pubKey.toString('hex')
                await publish(publishString, topic2)
                console.log("Published PUBKEY")

                // @ts-expect-error ts-migrate(2339) FIXME: Property 'id' does not exist on type '{}'.
                publishString = (s.id + ', ' + randomNumber)
                await publish(publishString, topic)
            }
        } else if (ersteRunde !== undefined && solutionNumber !== undefined) {
            receivedNumbers = []

            writeWinnerToLog(iteration, winnerPeerId, solutionNumber)
            solutionNumber = undefined
            ++iteration
            console.log("written Block ")

            // generate a random number 
            randomNumber = Math.floor(Math.random() * 100000).toString();
            console.log('Random number: ' + randomNumber)

            rolle = "rätsler"

            // @ts-expect-error ts-migrate(2339) FIXME: Property 'id' does not exist on type '{}'.
            let publishString = (s.id + ', ' + randomNumber)
            await publish(publishString, topic)
            ersteRunde = undefined
        }
    }

    async function startSleepThread() {

        // sleep for until next block is revealed
        console.log("neuer SLEEP Thread gestartet")

        await listenForSignatures(topic2)

        let p2sh = await sendMultiSigAddress(topic2)

        /*
        try {
            // To Do: Prüfen, ob in jeder Gewinnerrunde eine neue Verbindung erstellt wird
            await ecl.connect(
                "electrum-client-js", // optional client name
                "1.4.2" // optional protocol version
            )

            ecl.subscribe.on('blockchain.headers.subscribe', async (message) => {
*/
        if (rolle == "schläfer") {

            topic = "Quiz"
            let solution = "undefined"

            //let blockhash = bitcoin.Block.fromHex(message[0].hex);

            // to do substring letzte 4 Stellen und von hex zu dez = solution
            // blockhash = blockhash.hash.toString()
            //blockhash = blockhash.bits.toString()

            let solutionHex = 224564 //blockhash.slice(-4)

            solution = 'Solution ' + solutionHex //parseInt(solutionHex, 16);

            console.log("MESSAGES ", JSON.stringify(receivedNumbers))

            // publish solution
            let publishString = solution
            await publish(publishString, topic)

            console.log("Published Solution ", solution)

            if (receivedNumbers.length > 1) {
                solutionNumber = solution.split(' ')[1]
                // @ts-expect-error ts-migrate(2554) FIXME: Expected 2 arguments, but got 3.
                winnerPeerId = await determineWinner(receivedNumbers, solutionNumber, s.id)
                solutionNumber = undefined
            }

            if (winnerPeerId == undefined && receivedNumbers.length < 2) {
                console.log('KEINE MITSPIELER GEFUNDEN')
                // @ts-expect-error ts-migrate(2339) FIXME: Property 'id' does not exist on type '{}'.
                winnerPeerId = s.id
            }

            randomNumber = undefined
            receivedNumbers = []

            // Handle Zählerstand
            let eigeneCID = "cid"
            // @ts-expect-error ts-migrate(2339) FIXME: Property 'id' does not exist on type '{}'.
            receivedZählerstand.push(`${s.id}, ${eigeneCID}`)
            // @ts-expect-error ts-migrate(2339) FIXME: Property 'eigeneCID' does not exist on type '{}'.
            s.eigeneCID = undefined

            let uploadFile = undefined

            uploadFile = JSON.stringify(receivedZählerstand)
            console.log("Array Zählerstand = ", uploadFile)

            console.log('creating sha256 hash over data')
            let hash = undefined
            hash = sha256(uploadFile)
            console.info('hash über cidListe', hash)

            receivedZählerstand = []

            // @ts-expect-error ts-migrate(2339) FIXME: Property 'ipfs' does not exist on type '{}'.
            cid = await s.ipfs.add(uploadFile)

            publishString = "cid " + cid.path
            await publish(publishString, topic)

            cid = cid.path

            console.log("List of CIDs to IPFS: ", cid)

            console.log("Save CID and Hash to Doichain")

            // Write Hash and CID to Doichain
            // await writePoEToDoichain(cid, hash)
            // @ts-expect-error ts-migrate(2339) FIXME: Property 'ohnePeers' does not exist on type '{}'.
            s.ohnePeers = true
            await rewardWinner(topic2, p2sh, cid, hash)

            console.log("Executed in the worker thread");
            console.log('Ende von Runde. Nächste Runde ausgelöst')


            // @ts-expect-error ts-migrate(2339) FIXME: Property 'id' does not exist on type '{}'.
            if (winnerPeerId == s.id) {
                writeWinnerToLog(iteration, winnerPeerId, solution)
                // @ts-expect-error ts-migrate(2322) FIXME: Type 'undefined' is not assignable to type 'string... Remove this comment to see the full error message
                solution = undefined
                cid = undefined
                console.log("written Block ")
                console.log("von sleep thread neuer SLEEP thread")
                rolle = "schläfer"
                ++iteration

                // publish multisig of next round
                let p2sh = await sendMultiSigAddress(topic2)
                // @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
                m = p2sh.m
                // @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
                p2sh = p2sh.p2sh
            } else {
                writeWinnerToLog(iteration, winnerPeerId, solution)
                // @ts-expect-error ts-migrate(2322) FIXME: Type 'undefined' is not assignable to type 'string... Remove this comment to see the full error message
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
                // @ts-expect-error ts-migrate(2339) FIXME: Property 'id' does not exist on type '{}'.
                let publishString = (s.id + ', ' + randomNumber)
                await publish(publishString, topic)
            }
        }
        /*            })
                } catch (err) {
                    console.error(err);
                }*/
    }
}

export default quiz;