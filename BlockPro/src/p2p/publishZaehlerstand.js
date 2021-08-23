import uint8ArrayFromString from 'uint8arrays/from-string.js'

async function publishZählerstand(node, eigeneCID, id, topic2) {
        let publishZählerstand = ('Z '+ id + ', ' + eigeneCID)
        console.log('publishZählerstand = ' + publishZählerstand)
        node.pubsub.publish(topic2, uint8ArrayFromString(publishZählerstand))

}
export default publishZählerstand;