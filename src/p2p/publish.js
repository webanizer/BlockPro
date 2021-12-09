import uint8ArrayFromString from 'uint8arrays/from-string.js'
import { multiSigAddress } from '../doichainjs-lib/lib/createMultiSig.js'
import { createRequire } from "module"; 
const require = createRequire(import.meta.url); 
const bitcoin = require("bitcoinjs-lib")


export async function publishZählerstand(node, eigeneCID, id, topic2) {
        let publishZählerstand = ('Z '+ id + ', ' + eigeneCID)
        console.log('publishZählerstand = ' + publishZählerstand)
        node.pubsub.publish(topic2, uint8ArrayFromString(publishZählerstand))

}


export async function publishRandomNumber(node, randomNumber, id, topic) {
        let publishRandomNumber = (id + ', ' + randomNumber)
        console.log('publishRandomNumber = ' + publishRandomNumber)
        node.pubsub.publish(topic, uint8ArrayFromString(publishRandomNumber))

}


export async function publishPubKey(node, topic2, purpose, coinType) {
        // Get PubKey
        let newDerivationPath = `${purpose}/${coinType}/0/0/1`
        let xpub = bitcoin.bip32.fromBase58(hdkey.publicExtendedKey, global.DEFAULT_NETWORK)
        let pubKey = xpub.derivePath(newDerivationPath).publicKey
        pubKey = "pubKey " + pubKey.toString('hex')
        console.log('publishPubKey = ' + pubKey)
        node.pubsub.publish(topic2, uint8ArrayFromString(pubKey))
}


export async function publishMultiSigAddress(node, topic, network, receivedPubKeys, purpose, coinType, id) {
        // Get PubKey
        let newDerivationPath = `${purpose}/${coinType}/0/0/1`
        let keyPair = global.hdkey.derive(newDerivationPath)
        receivedPubKeys.push(keyPair.publicKey)

        if (receivedPubKeys.length == 1) {
                let newDerivationPath = `${purpose}/${coinType}/0/0/2`
                let keyPair = global.hdkey.derive(newDerivationPath)
                receivedPubKeys.push(keyPair.publicKey)
        }

        // generate multiSigAddress
        let p2sh = await multiSigAddress(receivedPubKeys, network)
        let multiSigAddr = 'multiSigAddress ' + p2sh.payment.address
        console.log('multiSigAddress' + multiSigAddr)
        await node.pubsub.publish(topic, uint8ArrayFromString(multiSigAddr))
        return p2sh
}

export async function publishPsbt(node, topic, psbtBaseText) {
        psbtBaseText = ("psbt ", psbtBaseText)
        node.pubsub.publish(topic, uint8ArrayFromString(psbtBaseText))
}

export async function publishSignature(node, topic, signedTx, id) {
        signedTx = ("signature ", signedTx)
        node.pubsub.publish(topic, uint8ArrayFromString(signedTx))
}
