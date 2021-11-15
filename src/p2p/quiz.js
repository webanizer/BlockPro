import publishRandomNumber from './publish.js'
import uint8ArrayToString from 'uint8arrays/to-string.js'
import determineWinner from './determineWinner.js'
import writeWinnerToLog from './writeWinnerToLog.js'
import { createRequire } from "module"; // Bring in the ability to create the 'require' method
const require = createRequire(import.meta.url); // construct the require method
import writePoEToDoichain from '../doichain/writePoEToDoichain.js'
import smartMeterInit from "../doichain/smartMeterInit.js"
const BitcoinCashZMQDecoder = require('bitcoincash-zmq-decoder');
const bitcoincashZmqDecoder = new BitcoinCashZMQDecoder("mainnet");


// This function is for the Quizmaster who sets the hidden number
var iteration
var receivedNumbers = []
var receivedZählerstand = []
var winnerPeerId
var randomNumber
var solutionNumber
var ersteRunde
var rolle
var cid

async function quiz(node, id, firstPeer) {

    let topic = "Quiz"

    await smartMeterInit(options, node, id, topic)

    iteration = 0

    if (firstPeer == true)
        console.log('I am SEED now ' + id)

    // subscribe to topic Quiz
    await node.pubsub.subscribe(topic)

    // Listener for Quiz numbers and meter readings
    await node.pubsub.on(topic, async (msg) => {

        let data = await msg.data
        let message = uint8ArrayToString(data)

        console.log('received message: ' + message)

        // Wenn Zählerstand
        if (message.includes('Z ')) {
            message = message.split('Z ')[1]

            receivedZählerstand.push(message)
        } else {
            // Wenn random number    
            let receivedPeerId = message.split(',')[0]
            if (!receivedNumbers.includes(`${receivedPeerId}`)) {
                receivedNumbers.push(message)
            }

            if (rolle == "rätsler") {
                raetsler()
            }
        }

    })


    if (firstPeer == true) {
        // listen for messages
        rolle = "schläfer"
        startSleepThread(iteration)
    } else {
        rolle = "rätsler"
        console.log("NEUES RÄTSEL")
        ersteRunde = true
    }

    async function raetsler() {

        // Wenn die Soltion in den empfangenen Nachrichten ist, Zahl speichern
        for (var j = 0; j < receivedNumbers.length; j++) {
            let value = receivedNumbers[j].toString();
            if (value.includes('Solution')) {
                solutionNumber = value.split('Solution ')[1]
                break
            }
        }

        if (solutionNumber !== undefined && receivedNumbers.length > 1) {

            // auch die eigene Nummer muss in den array
            receivedNumbers.push(`${id}, ${randomNumber}`)

            winnerPeerId = await determineWinner(receivedNumbers, solutionNumber, id)

            randomNumber = undefined
            receivedNumbers = []

            console.log("Winner PeerId and Solution number: " + winnerPeerId + ", " + solutionNumber)
            receivedZählerstand = []

            if (winnerPeerId == id) {
                console.log('Ende von Runde. Nächste Runde ausgelöst')

                writeWinnerToLog(iteration, winnerPeerId, solutionNumber)
                console.log("Was Rätsler now last Signer")

                console.log("written Block ")
                console.log("von Rätsel neuer sleep Thread ")
                rolle = "schläfer"
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
                publishRandomNumber(node, randomNumber, id, topic)
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

            publishRandomNumber(node, randomNumber, id, topic)
            ersteRunde = undefined
        }
    }

    async function startSleepThread() {

        // sleep for until next block is revealed
        console.log("neuer SLEEP Thread gestartet")

        var zmq = require("zeromq"),
            sock = zmq.socket("sub");

        sock.connect("tcp://116.203.151.175:28332");
        sock.subscribe("rawblock");
        console.log("Subscriber connected to port 28332");

        sock.on("message", async function (topic, message) {

            if (rolle == "schläfer") {
                //topic = topic.toString().replace(/ /g, '')
                topic = "Quiz"
                let solution = "undefined"

                let blockhash = bitcoincashZmqDecoder.decodeBlock(message);

                // to do substring letzte 4 Stellen und von hex zu dez = solution
                blockhash = blockhash.hash.toString()

                let solutionHex = blockhash.slice(-4)

                solution = 'Solution ' + parseInt(solutionHex, 16);

                console.log("MESSAGES ", JSON.stringify(receivedNumbers))

                // publish solution
                publishRandomNumber(node, solution, id, topic)
                console.log("Published Solution ", solution)

                if (receivedNumbers.length > 1) {
                    solutionNumber = solution.split(' ')[1]
                    winnerPeerId = await determineWinner(receivedNumbers, solutionNumber, id)
                    solutionNumber = undefined
                }


                if (winnerPeerId == undefined && receivedNumbers.length < 2) {
                    console.log('KEINE MITSPIELER GEFUNDEN')
                    winnerPeerId = id
                }

                randomNumber = undefined
                receivedNumbers = []

                // Handle Zählerstand
                receivedZählerstand.push(`${id}, ${eigeneCID}`)
                global.eigeneCID = undefined

                let uploadFile = undefined

                uploadFile = JSON.stringify(receivedZählerstand)
                console.log("Array Zählerstand = ", uploadFile)

                receivedZählerstand = []

                cid = await ipfs.add(uploadFile)

                cid = cid.path

                console.log("List of CIDs to IPFS: ", cid)

                console.log("Save CID and Hash to Doichain")

                // Write Hash and CID to Doichain
                await writePoEToDoichain(cid, hash)

                console.log("Executed in the worker thread");
                console.log('Ende von Runde. Nächste Runde ausgelöst')


                if (winnerPeerId == id) {
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
                    ++iteration
                    publishRandomNumber(node, randomNumber, id, topic)
                }
            }
        })

    }
}

export default quiz;