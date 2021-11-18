import uint8ArrayFromString from 'uint8arrays/from-string.js'
import { multiSigTx } from '../doichainjs-lib/lib/createMultiSigTx.js'


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


export async function publishPubKey(node, topic, purpose, coinType) {
        // Get PubKey
        let newDerivationPath = `${purpose}/${coinType}/0/0/1`
        xpub.derivePath(newDerivationPath).publicKey
        let pubKey = xpub.derivePath(newDerivationPath).publicKey
        pubKey = "pubKey " + pubKey
        console.log('publishPubKey = ' + pubKey)
        node.pubsub.publish(topic, uint8ArrayFromString(pubKey))
}


export async function publishMultiSigAddress(node, topic, network, addrType,  receivedPubKeys, purpose, coinType, id) {
        // Get PubKey
        let newDerivationPath = `${purpose}/${coinType}/0/0/1`
        xpub.derivePath(newDerivationPath).publicKey
        let myPubKey = xpub.derivePath(newDerivationPath).publicKey
        receivedPubKeys.push(myPubKey)

        // generate multiSigAddress
        let multiSigToSign = multiSigTx(receivedPubKeys, network, addrType, purpose, coinType, id)
        multiSigToSign = 'multiSigToSign ' + multiSigToSign
        console.log('multiSigToSign' + multiSigToSign)
        node.pubsub.publish(topic, uint8ArrayFromString(multiSigToSign))
}