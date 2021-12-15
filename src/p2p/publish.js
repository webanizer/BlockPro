import uint8ArrayFromString from 'uint8arrays/from-string.js'
import { multiSigAddress } from '../doichainjs-lib/lib/createMultiSig.js'
import { createRequire } from "module"; 
import { sharedStateObject, receivedPubKeys } from './sharedState.js';
const require = createRequire(import.meta.url); 
const bitcoin = require("bitcoinjs-lib")


export async function publishZählerstand(node, eigeneCID, id, topic2) {
        let publishZählerstand = ('Z '+ id + ', ' + eigeneCID)
        console.log('publishZählerstand = ' + publishZählerstand)
        node.pubsub.publish(topic2, uint8ArrayFromString(publishZählerstand))

}


export async function publishRandomNumber(randomNumber, topic) {
        let publishRandomNumber = (id + ', ' + randomNumber)
        console.log('publishRandomNumber = ' + publishRandomNumber)
        sharedStateObject.node.pubsub.publish(topic, uint8ArrayFromString(publishRandomNumber))

}


export async function publishPubKey(topic2) {
        // Get PubKey
        let newDerivationPath = `${sharedStateObject.purpose}/${sharedStateObject.coinType}/0/0/1`
        sharedStateObject.xpub = bitcoin.bip32.fromBase58(sharedStateObject.hdkey.publicExtendedKey, sharedStateObject.network)
        let pubKey = sharedStateObject.xpub.derivePath(newDerivationPath).publicKey
        pubKey = "pubKey " + pubKey.toString('hex')
        console.log('publishPubKey = ' + pubKey)
        node.pubsub.publish(topic2, uint8ArrayFromString(pubKey))
}


export async function publishMultiSigAddress(topic2) {
        // Get PubKey
        let newDerivationPath = `${sharedStateObject.purpose}/${sharedStateObject.coinType}/0/0/1`
        let keyPair = sharedStateObject.hdkey.derive(newDerivationPath)
        receivedPubKeys.push(keyPair.publicKey)

        if (receivedPubKeys.length == 1) {
                let newDerivationPath = `${sharedStateObject.purpose}/${sharedStateObject.coinType}/0/0/2`
                let keyPair = sharedStateObject.hdkey.derive(newDerivationPath)
                receivedPubKeys.push(keyPair.publicKey)
        }

        // generate multiSigAddress
        let p2sh = await multiSigAddress(sharedStateObject.network, receivedPubKeys)
        let multiSigAddr = 'multiSigAddress ' + p2sh.payment.address
        console.log('multiSigAddress' + multiSigAddr)
        await sharedStateObject.node.pubsub.publish(topic2, uint8ArrayFromString(multiSigAddr))
        return p2sh
}

export async function publishPsbt(topic, psbtBaseText) {
        psbtBaseText = ("psbt ", psbtBaseText)
        sharedStateObject.node.pubsub.publish(topic, uint8ArrayFromString(psbtBaseText))
}

export async function publishSignature(topic, signedTx) {
        signedTx = ("signature ", signedTx)
        sharedStateObject.node.pubsub.publish(topic, uint8ArrayFromString(signedTx))
}
