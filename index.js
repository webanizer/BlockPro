import { readFile } from 'fs/promises';
import transportLocalFile from "./src/doichain/test/transportLocalFile.js"
import createOrReadPeerId from './src/p2p/createOrReadPeerId.js'
import createNode from './src/p2p/createNode.js'
import peerDiscovery from './src/p2p/peerDiscovery.js'
import quiz from './src/p2p/quiz.js'
import { createOrReadSeed } from "./src/p2p/createOrReadSeed.js";
import { network } from './src/doichainjs-lib/index.js';
import { createNewWallet } from "./src/doichainjs-lib/lib/createNewWallet.js";
import { s } from "./src/p2p/sharedState.js";


var peerIdConf
var id
var node
var firstPeer


const main = async () => {
  const settingsTable = JSON.parse(await readFile(new URL('./settings.json', import.meta.url)));

  s.options = settingsTable.options

  transportLocalFile(s.options.transportLocalFilePath);

  // Start Quiz
  console.info('Starting p2p Quiz')

  peerIdConf = process.env.PEER;

  id = await createOrReadPeerId(peerIdConf)

  s.node = await createNode(id)

  await peerDiscovery(s.node)

  s.id = id.toB58String()
  s.network = network.DOICHAIN_REGTEST

  global.DEFAULT_NETWORK = network.DOICHAIN_REGTEST

  let o_options

  // check if seed file is available

  s.addrType = "p2wpkh"

  switch (s.addrType){
    case "p2pkh": 
      s.purpose = "m/44"
      break;
    case "p2sh":
      s.purpose = "m/49"
      break;
    case "p2wpkh":
      s.purpose = "m/84"
      break;
  }

  s.coinType = global.DEFAULT_NETWORK.name == "mainnet" ? 0 : 1
  s.account = 0 
  s.basePath = `${s.purpose}/${s.coinType}/${s.account}`
  
  await createOrReadSeed(id)
  s.wallet = await createNewWallet(s.hdkey, s.purpose, s.coinType, o_options, s.addrType, s.id)

  function getWinnerPeerId() {
    if (peerIdConf.includes('id-1')) {
      firstPeer = true
      quiz(firstPeer)
    } else {
      firstPeer = false
      quiz(firstPeer)
    }
  }

  getWinnerPeerId()
}

main()
