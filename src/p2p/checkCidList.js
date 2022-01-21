import { createRequire } from "module";
const require = createRequire(import.meta.url);
const bitcoin = require('bitcoinjs-lib')
import all from 'it-all'
import { s } from './sharedState.js';
import sha256 from "sha256";



export const checkCidList = async (message) => {

    let psbt = message
    let txToSign = bitcoin.Psbt.fromBase64(psbt, s.network)
    let outputs = txToSign.txOutputs
    let opscripts = []
    let cidList = ''
    let hash = ''
    let isValid = false

    // Aus txToSign cidList finden
    for (let i = 0; i < outputs.length; i++) {
        if (outputs[i].address == undefined && outputs[i].value == 1000000) {
            let script = outputs[i].script
            let message = bitcoin.script.toASM(script)
            let cidHex = message.split(" ")[1]
            let hashHex = message.split(" ")[2]

            for (var n = 0; n < cidHex.length; n += 2) {
                cidList += String.fromCharCode(parseInt(cidHex.substring(n, n + 2), 16));
            }

            for (var n = 0; n < hashHex.length; n += 2) {
                hash += String.fromCharCode(parseInt(hashHex.substring(n, n + 2), 16));
            }

        }
    }

    // read content of cidList
    var stream = s.ipfs.cat(cidList)
    let data = []

    for await (const chunk of stream) {
        // chunks of data are returned as a Buffer, convert it back to a string
        let message = chunk.toString()
        message = JSON.parse(message)
        if (message.length !== 0) {
            data.push(message[0].split(", ")[1])
        }
    }

    // winnerCidList abgleichen mit Queue
    let winnerCidList = data

    let matchingCids = compareCidListWithQueue(winnerCidList)

    if (hashIsCorrect(matchingCids, winnerCidList)) {
        // pin the cidList to own repo
        // To Do: Nicht alle müssen pinnen. Wie wählt man peers aus? Reward fürs pinnen? 
        await s.ipfs.pin.add(cidList, true)

        // returns all pinned data
        //let pinList = await all(s.ipfs.pin.ls())

        const pinset = await all(s.ipfs.pin.ls({
            paths: cidList
        }))

        // Assure that current cid was pinned
        if (!pinset) {
            throw 'Cid was not pinned';
        }

        isValid = true
    }
    return isValid
}


export const compareCidListWithQueue = (winnerCidList) => {

    let matchingCids = []

    // Compare winnerCidList and receivedZählerstand
    for (let i = 0; i < s.receivedZählerstand.length; i++) {
        var index = winnerCidList.indexOf(s.receivedZählerstand[i]);
        if (index !== -1) {
            matchingCids.push(s.receivedZählerstand[i])
        }
    }

    console.log("matching cids ", matchingCids)

    return matchingCids
}



export const hashIsCorrect = (matchingCids, winnerCidList) => {

    let hashIsCorrect = false
    // Matching Cids sortieren und hash erzeugen
    if (matchingCids.length == winnerCidList.length) {
        matchingCids = matchingCids.sort()
        s.sha256 = sha256(matchingCids)
        if (s.sha256 == savedHash) {
            console.log("hash in doichain is correct")
            hashIsCorrect = true
        } else {
            // To Do: Handling für wenn der hash in der Doichain falsch ist. Staking Bestrafung
            console.log("hash in doichain isn't correct")
        }
    }
    return hashIsCorrect
}
