import publishRandomNumber from './publishRandomNumber.js'
import uint8ArrayToString from 'uint8arrays/to-string.js'
import determineWinner from './determineWinner.js'
import writeWinnerToLog from './writeWinnerToLog.js'
import { createRequire } from "module"; // Bring in the ability to create the 'require' method
const require = createRequire(import.meta.url); // construct the require method
import writePoEToDoichain from '../doichain/writePoEToDoichain.js'
import smartMeterInit from "../doichain/smartMeterInit.js"


// This function is for the Quizmaster who sets the hidden number
var iteration
var receivedNumbers = []
var receivedZählerstand = []
var winnerPeerId
var solution
var randomNumber
var solutionNumber
var ersteRunde
var rolle
var cid

async function quiz(node, id, seed) {

    let topic = "Quiz"

    await smartMeterInit(options, node, id, topic)

    iteration = 0

    if (seed == true)
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


    if (seed == true) {
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

                solution = undefined
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
                randomNumber = Math.floor(Math.random() * 300).toString();
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
            randomNumber = Math.floor(Math.random() * 300).toString();
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

        sock.connect("tcp://172.22.0.5:28332");
        sock.subscribe("rawblock");
        console.log("Subscriber connected to port 28332");

        topic = "72 61 77 62 6c 6f 63 6b"
        topic = topic.replace(/ /g,'')
        var hex = topic.toString();
        var str = '';
        for (var i = 0; i < hex.length; i += 2) {
            var v = parseInt(hex.substr(i, 2), 16);
            if (v) str += String.fromCharCode(v);
        }
    
    console.log(str)

    sock.on("message", async function (topic, message) {

        topic = topic.toString().replace(/ /g,'')
        message = message.toString()


        console.log("received a message related to:", topic, "containing message:", message);

        blockhash = message

        // to do substring letzte 4 Stellen und von hex zu dez = solution

        let solution = 'Solution ' + (blockhash.slice(-4));

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

        let uploadFile = undefined

        uploadFile = JSON.stringify(receivedZählerstand)
        console.log("Array Zählerstand = ", uploadFile)

        receivedZählerstand = []

        cid = await ipfs.add(uploadFile)

        cid = cid.path

        console.log("List of CIDs to IPFS: ", cid)

        console.log("Saved CID and Hash to Doichain")

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
            startSleepThread()
        } else {
            writeWinnerToLog(iteration, winnerPeerId, solution)
            solution = undefined
            console.log("written Block ")
            console.log("von sleep thread NEUES RÄTSEL ")

            console.log("NEUES RÄTSEL")
            // generate a random number 
            randomNumber = Math.floor(Math.random() * 300).toString();
            console.log('Random number: ' + randomNumber)

            rolle = "rätsler"
            ++iteration
            publishRandomNumber(node, randomNumber, id, topic)
        }
    })

}
}

export default quiz;