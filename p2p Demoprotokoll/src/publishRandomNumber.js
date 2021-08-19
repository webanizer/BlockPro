const uint8ArrayFromString = require('uint8arrays/from-string')

async function publishRandomNumber(node, randomNumber, id, topic) {
        let publishRandomNumber = (id + ', ' + randomNumber)
        console.log('publishRandomNumber = ' + publishRandomNumber)
        node.pubsub.publish(topic, uint8ArrayFromString(publishRandomNumber))

}
module.exports.publishRandomNumber = publishRandomNumber;