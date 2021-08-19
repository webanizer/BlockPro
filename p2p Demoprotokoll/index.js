const { createOrReadPeerId } = require('./src/createOrReadPeerId')
const { createNode } = require('./src/createNode.js')
const { peerDiscovery } = require('./src/peerDiscovery.js')
const { quiz } = require('./src/quiz.js')

var peerIdConf
var id
var node
var seed

async function main() {

  peerIdConf = process.env.PEER;

  id = await createOrReadPeerId(peerIdConf)

  node = await createNode(id)

  await peerDiscovery(node)

  id = id.toB58String()


  async function getWinnerPeerId() {
    if (peerIdConf.includes('id-1')) {
      seed = true
      await quiz(node, id, seed)
    } else {
      seed = false
      await quiz(node, id, seed)
    }
  }

  await getWinnerPeerId()
}

main()