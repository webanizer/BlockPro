import sha256 from 'sha256'
import writeToIPFS from './ipfs.js'
import createOrReadPeerId from '../p2p/createOrReadPeerId.js'
import createNode from '../p2p/createNode.js'
import peerDiscovery from '../p2p/peerDiscovery.js'
import quiz from '../p2p/quiz.js'

var peerIdConf
var id
var node
var seed

const smlToIpfs = async (err, obisResult) => {  
  
    let obisJSON = { }

    if (err) {
      console.error('err', err)      
      return;
    }    
    
    for (let obisId in obisResult) {    
        obisJSON[obisResult[obisId].idToString()] = obisResult[obisId].valueToString()
    }

    obisJSON["timestamp"] = Date.now()
    let stringJSON = JSON.stringify(obisJSON)
    console.log("__tringJSON", stringJSON)

    console.log('creating sha256 hash over data')
    const hash = sha256(stringJSON)
    console.info('__our hash', hash)

    console.info('writing data into ipfs')
    const cid = await writeToIPFS(global.ipfs, stringJSON)
    console.info('__cid', cid)    

    console.info('Starting p2p Quiz')

    peerIdConf = process.env.PEER;

    id = await createOrReadPeerId(peerIdConf)
  
    node = await createNode(id)
  
    await peerDiscovery(node)
  
    id = id.toB58String()
  
    async function getWinnerPeerId() {
      if (peerIdConf.includes('id-1')) {
        seed = true
        await quiz(node, id, seed, cid, hash)
      } else {
        seed = false
        await quiz(node, id, seed, cid, hash)
      }
    }
  
    await getWinnerPeerId()
   
}
export default smlToIpfs


