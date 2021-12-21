import uint8ArrayFromString from 'uint8arrays/from-string.js'
import { multiSigAddress } from '../doichainjs-lib/lib/createMultiSig.js'
import { createRequire } from "module";
import { s, receivedPubKeys } from './sharedState.js';
const require = createRequire(import.meta.url);
const bitcoin = require("bitcoinjs-lib")


export async function publishZählerstand(node, eigeneCID, id, topic2) {
        let publishZählerstand = ('Z ' + id + ', ' + eigeneCID)
        console.log('publishZählerstand = ' + publishZählerstand)
        node.pubsub.publish(topic2, uint8ArrayFromString(publishZählerstand))

}


export async function publishRandomNumber(randomNumber, topic) {
        let publishRandomNumber = (s.id + ', ' + randomNumber)
        console.log('publishRandomNumber = ' + publishRandomNumber)
        s.node.pubsub.publish(topic, uint8ArrayFromString(publishRandomNumber))

}


export async function publishPubKey(topic2) {
        // Get PubKey
        let newDerivationPath = `${s.purpose}/${s.coinType}/0/0/1`
        s.xpub = bitcoin.bip32.fromBase58(s.hdkey.publicExtendedKey, s.network)
        let pubKey = s.xpub.derivePath(newDerivationPath).publicKey
        pubKey = "pubKey " + pubKey.toString('hex')
        console.log('publishPubKey = ' + pubKey)
        s.node.pubsub.publish(topic2, uint8ArrayFromString(pubKey))
}


export async function publishMultiSigAddress(topic2, multiSigAddr) {
        if (multiSigAddr == undefined) {
                if( receivedPubKeys.length > 0){
                        s.ohnePeers = false
                }
                // Get PubKey 
                let newDerivationPath = `${s.purpose}/${s.coinType}/0/0/1`
                let keyPair = s.hdkey.derive(newDerivationPath)
                receivedPubKeys.push(keyPair.publicKey)

                if (receivedPubKeys.length == 1) {
                        let newDerivationPath = `${s.purpose}/${s.coinType}/0/0/2`
                        let keyPair = s.hdkey.derive(newDerivationPath)
                        receivedPubKeys.push(keyPair.publicKey)
                }

                // generate multiSigAddress
                let p2sh = await multiSigAddress(s.network, receivedPubKeys)
                let multiSigAddr = 'multiSigAddress ' + p2sh.payment.address
                console.log('multiSigAddress' + multiSigAddr)
                await s.node.pubsub.publish(topic2, uint8ArrayFromString(multiSigAddr))
                return p2sh
        }
        await s.node.pubsub.publish(topic2, uint8ArrayFromString(multiSigAddr))
}

export async function publishPsbt(topic2, psbtBaseText) {
        psbtBaseText = "psbt " + psbtBaseText
        s.node.pubsub.publish(topic2, uint8ArrayFromString(psbtBaseText))
        console.log("Published partially signed tx to peers ", psbtBaseText)
}

export async function publishSignature(topic, signedTx) {
        signedTx = ("signature ", signedTx)
        s.node.pubsub.publish(topic, uint8ArrayFromString(signedTx))
}
