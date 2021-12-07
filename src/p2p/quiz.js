import { publishRandomNumber, publishSignature } from './publish.js'
import uint8ArrayToString from 'uint8arrays/to-string.js'
import determineWinner from './determineWinner.js'
import writeWinnerToLog from './writeWinnerToLog.js'
import { createRequire } from "module"; // Bring in the ability to create the 'require' method
const require = createRequire(import.meta.url); // construct the require method
import writePoEToDoichain from '../doichain/writePoEToDoichain.js'
import smartMeterInit from "../doichain/smartMeterInit.js"
import { signMultiSigTx } from "../doichainjs-lib/lib/createMultiSig.js"
import { sendMultiSigAddress, rewardWinner } from './reward.js';
const BitcoinCashZMQDecoder = require('bitcoincash-zmq-decoder');
const bitcoincashZmqDecoder = new BitcoinCashZMQDecoder("mainnet");
let bitcoin = require('bitcoinjs-lib');



// This function is for the Quizmaster who sets the hidden number
var iteration
var receivedNumbers = []
var receivedZählerstand = []
var receivedPubKeys = []
var receivedSignatures = []
var winnerPeerId
var randomNumber
var solutionNumber
var ersteRunde
var rolle
var cid

async function quiz(node, id, firstPeer, network, addrType, purpose, account, coinType) {

    let topic = "quizGuess"

    let topic2 = "rewardPayment"

    // subscribe to topic multiSig
    await node.pubsub.subscribe(topic2)
   
    const ecl = global.client //new ElectrumClient('itchy-jellyfish-89.doi.works', 50002, 'tls')
    let m
    let p2sh = await sendMultiSigAddress (node, topic2, network, receivedPubKeys, purpose, coinType, id, m)
    m = p2sh.m
    p2sh = p2sh.p2sh
    await rewardWinner(node, topic2,receivedPubKeys, network, addrType, purpose, coinType, account, id, p2sh, receivedSignatures, m)

    await smartMeterInit(options, node, id, topic)

    iteration = 0
    let ersteBezahlung = true

    if (firstPeer == true)
        console.log('I am SEED now ' + id)
        

    // subscribe to topic Quiz
    await node.pubsub.subscribe(topic)

    await listenToTopic2(node, topic2, receivedPubKeys, receivedSignatures)


    // Listener for Quiz numbers and meter readings
    await node.pubsub.on(topic, async (msg) => {

        let data = await msg.data
        let message = uint8ArrayToString(data)

        console.log('received message: ' + message)

        // Wenn Zählerstand
        if (message.includes('Z ')) {
            message = message.split('Z ')[1]

            receivedZählerstand.push(message)
        } 
        else {
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

        // listen for multiSigAddress and psbt that needs a Signature
        await node.pubsub.on(topic2, async (msg) => {

            let data = await msg.data
            let message = uint8ArrayToString(data)
    
            console.log('received message: ' + message)
    
            // Wenn Zählerstand
            if (message.includes('multiSigAddress') && ersteBezahlung == true){
                let destAddress = message.split(' ')[1]
                let amount = 0.5
                let nameId
                let nameValue
                await createAndSendTransaction(global.seed,global.password, amount, destAddress, global.wallet, nameId, nameValue)
                ersteBezahlung = false
            } else if (message.includes('psbt')){
                message = message.split(' ')[1]
                let signedTx = await signMultiSigTx(purpose, coinType, psbt)
                await publishSignature(node, topic2, signedTx, id)
            }
        })

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
            receivedNumbers.push(`${id}, ${randomNumber}`)

            publishPubKey(node, randomNumber, id, topic, purpose, coinType)

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

        try {
            await ecl.connect(
                "electrum-client-js", // optional client name
                "1.4.2" // optional protocol version
            )
            const header = await ecl.blockchain_headers_subscribe()
            console.log("latest header ", header)

            ecl.subscribe.on('blockchain.headers.subscribe', async (message) => {

                if (rolle == "schläfer") {
                                   
                    topic = "Quiz"
                    let solution = "undefined"

                    let blockhash = bitcoin.Block.fromHex(message[0].hex);

                    // to do substring letzte 4 Stellen und von hex zu dez = solution
                    // blockhash = blockhash.hash.toString()
                    blockhash = blockhash.bits.toString()

                    let solutionHex = blockhash.slice(-4)

                    solution = 'Solution ' + solutionHex //parseInt(solutionHex, 16);

                    console.log("MESSAGES ", JSON.stringify(receivedNumbers))

                    //let p2sh = await publishMultiSigAddress(node, topic, network, addrType, receivedPubKeys, purpose, coinType, id)
                    //let multiSigAddress = p2sh.payment.address
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
                   // await writePoEToDoichain(cid, hash)

                    //await multiSigTx(network, addrType, purpose, coinType, id, p2sh)

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
        } catch (err) {
            console.error(err);
        }
    }
}

export default quiz;