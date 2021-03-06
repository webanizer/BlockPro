import { publish, getKeyPair, getNewPubKey } from './publish.js'
import uint8ArrayToString from 'uint8arrays/to-string.js'
import sha256 from 'sha256'
import determineWinner from './determineWinner.js'
import writeWinnerToLog from './writeWinnerToLog.js'
import { createRequire } from "module"; // Bring in the ability to create the 'require' method
const require = createRequire(import.meta.url); // construct the require method
import writePoEToDoichain from '../doichain/writePoEToDoichain.js'
import { returnUnusedAddress } from 'doichainjs-lib'
import smartMeterInit from "../doichain/smartMeterInit.js"
import { rewardWinner } from './reward.js';
import { rästlerListener, listenForPubKeys } from './pubsubListeners.js'
import { s, receivedPubKeys } from './sharedState.js';
import { multiSigAddress } from '../doichain/createMultiSig.js'
const BitcoinCashZMQDecoder = require('bitcoincash-zmq-decoder');
const bitcoincashZmqDecoder = new BitcoinCashZMQDecoder("mainnet");
let bitcoin = require('bitcoinjs-lib');
import { listenForSignatures } from './pubsubListeners.js';


// This function is for the Quizmaster who sets the hidden number
var iteration
var receivedNumbers = []
var m
var winnerPeerId
var randomNumber
var solutionNumber
var cid

async function quiz(firstPeer) {

    s.ecl = global.client //new ElectrumClient('itchy-jellyfish-89.doi.works', 50002, 'tls')

    let topicQuiz = "quizGuess"
    let topicReward = "rewardPayment"
    let topicSignatures = "signatures"

    s.receivedZählerstand = []
    s.solutionReceived = false
    s.listenForSignatures = false

    // Start reading meter data
    await smartMeterInit(s.options, topicQuiz)

    // subscribe to topic Quiz
    await s.node.pubsub.subscribe(topicQuiz)

    // subscribe to topic rewardPayment
    await s.node.pubsub.subscribe(topicReward)

    // listen for signatures
    await s.node.pubsub.subscribe(topicSignatures)
    await listenForSignatures(topicSignatures)

    iteration = 0
    s.ersteBezahlung = true

    if (firstPeer == true)
        console.log('I am SEED now ' + s.id)

    // erste Runde findet ohne Peers statt
    s.ohnePeersAktuelleRunde = true
    s.ohnePeersLetzteRunde = true

    await listenForPubKeys()
    await rästlerListener(topicReward)

    // Listener for Quiz numbers and meter readings
    await s.node.pubsub.on(topicQuiz, async (msg) => {


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
                let number = message.split("-")[0]
                let pubKey = message.split("-")[1]
                console.log("pubkey from guess = " + pubKey)

                // To Do: Prüfen ob Eintrittszahlung getätigt wurde

                receivedNumbers.push(number)
            }

            if (s.rolle == "rätsler") {
                raetsler()
            }
        }

    })


    if (firstPeer == true) {
        // listen for messages
        s.rolle = "schläfer"
        s.ersteRunde = true
        s.zweiteRunde = false
        startSleepThread(iteration)
        
    } else {
        s.rolle = "rätsler"
        console.log("NEUES RÄTSEL")
        s.ersteRunde = true

        // start listening for new Blocks
        startSleepThread(iteration)
    }

    async function raetsler() {
        // Wenn die Solution in den empfangenen Nachrichten ist, Zahl speichern
        for (var j = 0; j < receivedNumbers.length; j++) {
            let value = receivedNumbers[j].toString();
            if (value.includes('Solution')) {
                solutionNumber = value.split('Solution ')[1]
                s.solutionReceived = true
                break
            }
        }

        winnerPeerId = undefined

        if (solutionNumber !== undefined && receivedNumbers.length > 1) {

            winnerPeerId = await determineWinner(receivedNumbers, solutionNumber, s.id)

            randomNumber = undefined
            receivedNumbers = []

            console.log("Winner PeerId and Solution number: " + winnerPeerId + ", " + solutionNumber)

            // wenn vorige Runde ohne peers war, kein Gewinnerwechsel, weil pubKeys zum Signieren dieser Runde der vorige Peer hat
            if (s.ohnePeersLetzteRunde || s.zweiteRunde) {
                winnerPeerId = undefined
            }
            s.currentWinner = winnerPeerId

            if (winnerPeerId == s.id) {
                receivedNumbers = []
                console.log('Ende von Runde. Nächste Runde ausgelöst')

                writeWinnerToLog(iteration, winnerPeerId, solutionNumber)

                console.log("Was Rätsler now last Signer")

                console.log("written Block ")
                console.log("von Rätsel neuer sleep Thread ")
                ++iteration
                solutionNumber = undefined
                s.ersteRunde = false
                winnerPeerId = undefined

            } else {
                receivedNumbers = []
                writeWinnerToLog(iteration, winnerPeerId, solutionNumber)

                console.log("written Block ")
                console.log("von Rätsel NEUES RÄTSEL")
                solutionNumber = undefined

                let keyPair = getKeyPair(`${s.basePath}/0/1`)
                let pubkey = keyPair.publicKey.toString("hex")

                // generate a random number 
                randomNumber = Math.floor(Math.random() * 100000).toString();
                console.log('Random number: ' + randomNumber)
                let publishString = (s.id + ', ' + randomNumber + "-" + pubkey)
                await publish(publishString, topicQuiz)
                receivedNumbers.push(`${s.id}, ${randomNumber}`)

                s.ersteRunde = false
                winnerPeerId = undefined
                ++iteration
            }
        } else if (s.ersteRunde !== false && solutionNumber !== undefined) {
            receivedNumbers = []

            writeWinnerToLog(iteration, winnerPeerId, solutionNumber)
            solutionNumber = undefined
            ++iteration
            console.log("written Block ")

            let keyPair = getKeyPair(`${s.basePath}/0/1`)
            let pubkey = keyPair.publicKey.toString("hex")

            // generate a random number 
            randomNumber = Math.floor(Math.random() * 100000).toString();
            console.log('Random number: ' + randomNumber)
            let publishString = (s.id + ', ' + randomNumber + "-" + pubkey)
            await publish(publishString, topicQuiz)
            receivedNumbers.push(`${s.id}, ${randomNumber}`)

            winnerPeerId = undefined
            s.ersteRunde = false
            s.zweiteRunde = true
        }
    }

    async function startSleepThread() {

        if (s.ersteRunde && s.rolle == "schläfer") {
            // Get PubKey 
            let keyPair = getKeyPair(`${s.basePath}/0/1`)
            receivedPubKeys.push(keyPair.publicKey)

            // falls nicht schon andere pubKeys empfangen wurden
            if (receivedPubKeys.length == 1) {
                let keyPair = getKeyPair(`${s.basePath}/0/2`)
                receivedPubKeys.push(keyPair.publicKey)
            }

            // generate first multiSigAddress
            s.p2sh = multiSigAddress(s.network, receivedPubKeys)
            console.log("FIRST MULTISIG ADDRESS: " + s.p2sh.payment.address)
        }

        try {
            s.ecl.subscribe.on('blockchain.headers.subscribe', async (message) => {

                console.log("letzte Runde Lösung empfangen? ", s.solutionReceived)

                // nachdem erster Public Key publiziert wurde, kann er erst nach 2 Runden signiert werden
                if (s.iterationAfterPubkey == undefined){
                    s.iterationAfterPubkey = 0
                } else {
                    s.iterationAfterPubkey == ++s.iterationAfterPubkey
                }

                // Falls in der letzten Runde der nächste Gewinner ausgetreten ist 
                if (!s.solutionReceived && !s.ersteRunde) {
                    console.log("Alternativer Gewinner: ", s.secondWinner)
                    for (var i = 0; i < receivedNumbers.length; i++) {
                        // delete next winner guess from received numbers 
                        if (receivedNumbers[i].includes(s.secondWinner)) {
                            console.log("deleted next winner guess, ", receivedNumbers[i])
                            receivedNumbers.splice(i, 1)
                        }
                    }

                    if (s.secondWinner !== s.id) {
                        s.rolle = "rätsler"
                        console.log("I am NOT second winner")
                    } else {
                        s.rolle = "schläfer"
                        console.log("I am second winner")
                    }
                }

                if (s.rawtx !== undefined && s.solutionReceived) {
                    if (s.rawtx.length == 0 && !s.zweiteRunde) {
                        // Wenn keine rawtx empfangen wurde, dann muss an dieser Stelle der Rollenwechsel passieren
                        // To Do: Handling wenn der nächste Gewinner ausgetreten ist. 
                        // Wenn in der letzten Runde keine Lösung verschickt wurde dann muss die Transaktion auch wiederholt werden.
                        if (s.rolle == "schläfer") {
                            // wird normalerweise nach letzter empfangener Signatur ausgeführt 
                            s.signWithCurrent = s.signWithNext
                            console.log("current sign with Winner: " + s.signWithCurrent)

                            // publish pubkey für die übernächste Runde 
                            let topicPubKeys = "pubkeys"
                            let pubKey = getNewPubKey()

                            s.signWithNext = s.lastDerPath
                            console.log("next derPath Winner: " + s.signWithNext)

                            let publishString = "pubKey " + pubKey.toString('hex')
                            receivedPubKeys.push(pubKey)
                            await publish(publishString, topicPubKeys)
                            console.log("Published PUBKEY with derPath: " + s.lastDerPath)
                        }

                        if (s.currentWinner !== s.id) {
                            s.rolle = "rätsler"
                            s.currentWinner = undefined
                            s.ersteBezahlung = false
                        } else {
                            s.rolle = "schläfer"
                        }
                        console.log("Letzte Transaktion war nicht erfolgreich und muss wiederholt werden")
                    } else {
                        s.rawtx = ""
                    }
                }

                s.solutionReceived = false

                console.log("should start next round now as: ", s.rolle)

                if (s.rolle == "schläfer") {
                    
                    // sleep for until next block is revealed
                    console.log("neuer SLEEP Thread gestartet")
                    topicQuiz = "quizGuess"
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
                    await publish(publishString, topicQuiz)

                    console.log("Published Solution ", solution)
                    s.solutionReceived = true

                    if (receivedNumbers.length > 0) {
                        solutionNumber = solution.split(' ')[1]
                        receivedNumbers.push(solution)
                        winnerPeerId = await determineWinner(receivedNumbers, solutionNumber)
                        solutionNumber = undefined
                    }

                    if (winnerPeerId == undefined && receivedNumbers.length < 1 || s.ohnePeersLetzteRunde) {
                        console.log('KEINE MITSPIELER GEFUNDEN')
                        winnerPeerId = s.id
                    }

                    s.currentWinner = winnerPeerId

                    randomNumber = undefined
                    receivedNumbers = []

                    // Handle Zählerstand
                    if (s.eigeneCID !== undefined) {
                        s.receivedZählerstand.push(`${s.id}, ${s.eigeneCID}`)
                        s.eigeneCID = undefined
                    }

                    let uploadFile = undefined
                    s.cidList = s.receivedZählerstand.sort()

                    uploadFile = JSON.stringify(s.receivedZählerstand.sort())
                    console.log("Array Zählerstand = ", uploadFile)

                    console.log('creating sha256 hash over data')
                    let hash = undefined
                    hash = sha256(uploadFile)
                    console.info('hash über cidListe', hash)

                    cid = await s.ipfs.add(uploadFile)

                    publishString = "cid " + cid.path
                    await publish(publishString, topicReward)

                    cid = cid.path

                    console.log("List of CIDs to IPFS: ", cid)

                    console.log("Save CID and Hash to Doichain")

                    // Write Hash and CID to Doichain
                    // await writePoEToDoichain(cid, hash)

                    await rewardWinner(topicReward, cid, hash)

                    console.log("Executed in the worker thread");
                    console.log('Ende von Runde. Nächste Runde ausgelöst')


                    if (winnerPeerId == s.id) {
                        writeWinnerToLog(iteration, winnerPeerId, solution)
                        winnerPeerId = undefined
                        solution = undefined
                        cid = undefined
                        console.log("written Block ")
                        console.log("von sleep thread neuer SLEEP thread")

                        ++iteration
                    } else {
                        writeWinnerToLog(iteration, winnerPeerId, solution)
                        winnerPeerId = undefined
                        solution = undefined
                        cid = undefined
                        console.log("written Block ")
                        console.log("von sleep thread NEUES RÄTSEL ")

                        console.log("NEUES RÄTSEL")

                        let keyPair = getKeyPair(`${s.basePath}/0/1`)
                        let pubkey = keyPair.publicKey.toString("hex")

                        // generate a random number 
                        randomNumber = Math.floor(Math.random() * 100000).toString();
                        console.log('Random number: ' + randomNumber)
                        let publishString = (s.id + ', ' + randomNumber + "-" + pubkey)

                        await publish(publishString, topicQuiz)
                        console.log('Random number: ' + randomNumber)
                        receivedNumbers.push(`${s.id}, ${randomNumber}`)

                        ++iteration
                    }
                }
            })
        } catch (err) {
            console.error(err);
        }
    }
}

export default quiz;