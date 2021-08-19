const uint8ArrayFromString = require('uint8arrays/from-string')


async function publishWinner(node, ẃinnerPeerId, topic) {

        let publishWinner = ('winnerPeerId' + ', ' + ẃinnerPeerId)
        console.log('published winnerPeerId = ' + publishWinner)
        node.pubsub.publish(topic, uint8ArrayFromString(publishWinner))

}
module.exports.publishWinner = publishWinner;