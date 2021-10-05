import uint8ArrayFromString from 'uint8arrays/from-string'


const publishWinner = async (node, ẃinnerPeerId, topic) => {

        let publishWinner = ('winnerPeerId' + ', ' + ẃinnerPeerId)
        console.log('published winnerPeerId = ' + publishWinner)
        node.pubsub.publish(topic, uint8ArrayFromString(publishWinner))

}
export default publishWinner;