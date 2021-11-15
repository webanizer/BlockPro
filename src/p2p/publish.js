import uint8ArrayFromString from 'uint8arrays/from-string.js'


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


async function publishPubKey(node, randomNumber, id, topic) {
        // Get PubKey
        pubKey = getAddress()
        console.log('publishRandomNumber = ' + publishRandomNumber)
        node.pubsub.publish(topic, uint8ArrayFromString(publishRandomNumber))

}
export default publishRandomNumber;