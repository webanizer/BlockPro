import uint8ArrayFromString from 'uint8arrays/from-string.js'
import multiSigTx from '../doichainjs-lib/lib/createMultiSigTx.js'


async function publishZählerstand(node, eigeneCID, id, topic2) {
        let publishZählerstand = ('Z '+ id + ', ' + eigeneCID)
        console.log('publishZählerstand = ' + publishZählerstand)
        node.pubsub.publish(topic2, uint8ArrayFromString(publishZählerstand))

}
export default publishZählerstand;

const publishWinner = async (node, ẃinnerPeerId, topic) => {

        let publishWinner = ('winnerPeerId' + ', ' + ẃinnerPeerId)
        console.log('published winnerPeerId = ' + publishWinner)
        node.pubsub.publish(topic, uint8ArrayFromString(publishWinner))

}
export default publishWinner;

async function publishRandomNumber(node, randomNumber, id, topic) {
        let publishRandomNumber = (id + ', ' + randomNumber)
        console.log('publishRandomNumber = ' + publishRandomNumber)
        node.pubsub.publish(topic, uint8ArrayFromString(publishRandomNumber))

}
export default publishRandomNumber;


async function publishPubKey(node, topic, purpose, coinType) {
        // Get PubKey
        let newDerivationPath = `${purpose}/${coinType}/0/0/1`
        xpub.derivePath(newDerivationPath).publicKey
        let pubKey = xpub.derivePath(newDerivationPath).publicKey
        pubKey = "pubKey " + pubKey
        console.log('publishPubKey = ' + pubKey)
        node.pubsub.publish(topic, uint8ArrayFromString(pubKey))
}
export default publishPubKey;


async function publishMultiSigAddress(node, topic, receivedPubKeys, purpose, coinType) {
        // Get PubKey
        let newDerivationPath = `${purpose}/${coinType}/0/0/1`
        xpub.derivePath(newDerivationPath).publicKey
        let myPubKey = xpub.derivePath(newDerivationPath).publicKey
        receivedPubKeys.push(myPubKey)

        // generate multiSigAddress
        let multiSigAddress = multiSigTx(receivedPubKeys)
        console.log('multiSig Address' + multiSigAddress)
        node.pubsub.publish(topic, uint8ArrayFromString(multiSigAddress))
}
export default publishMultiSigAddress;