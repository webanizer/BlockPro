import uint8ArrayFromString from 'uint8arrays/from-string.js'

async function publishRandomNumber(node, randomNumber, id, topic) {
        let publishRandomNumber = (id + ', ' + randomNumber)
        console.log('publishRandomNumber = ' + publishRandomNumber)
        node.pubsub.publish(topic, uint8ArrayFromString(publishRandomNumber))

}
export default publishRandomNumber;