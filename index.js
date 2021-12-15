import { createRequire } from "module"; 
const require = createRequire(import.meta.url); 
import { readFile } from 'fs/promises';
import transportLocalFile from "./src/doichain/test/transportLocalFile.js"
import createOrReadPeerId from './src/p2p/createOrReadPeerId.js'
import createNode from './src/p2p/createNode.js'
import peerDiscovery from './src/p2p/peerDiscovery.js'
import quiz from './src/p2p/quiz.js'
import { createOrReadSeed } from "./src/p2p/createOrReadSeed.js";
import { network } from './src/doichainjs-lib/index.js';
import { createNewWallet } from "./src/doichainjs-lib/lib/createNewWallet.js";
import { sharedStateObject } from "./src/p2p/sharedState.js";
import { DEFAULT_NETWORK } from "./src/doichainjs-lib/lib/network.js";

var peerIdConf
var id
var node
var firstPeer


const main = async () => {
  const settingsTable = JSON.parse(await readFile(new URL('./settings.json', import.meta.url)));

  global.options = settingsTable.options

  const doichainRpcClient = settingsTable.doichain;
  const credentials = doichainRpcClient.username + ':' + doichainRpcClient.password;
  global.url = 'http://' + credentials + '@' + doichainRpcClient.host + ':' + doichainRpcClient.port

  transportLocalFile(options.transportLocalFilePath);

  // Start Quiz
  console.info('Starting p2p Quiz')

  peerIdConf = process.env.PEER;

  id = await createOrReadPeerId(peerIdConf)

  sharedStateObject.node = await createNode(id)

  await peerDiscovery(sharedStateObject.node)

  sharedStateObject.id = id.toB58String()
  sharedStateObject.network = network.DOICHAIN_TESTNET

  global.DEFAULT_NETWORK = network.DOICHAIN_TESTNET

  let o_options

  // check if seed file is available

  sharedStateObject.addrType = "p2wpkh"

  switch (sharedStateObject.addrType){
    case "legacy": 
      sharedStateObject.purpose = "m/44"
      break;
    case "p2sh":
      sharedStateObject.purpose = "m/49"
      break;
    case "p2wpkh":
      sharedStateObject.purpose = "m/84"
      break;
  }

  sharedStateObject.coinType = global.DEFAULT_NETWORK.name == "mainnet" ? 0 : 1
  sharedStateObject.account = 0 
  
  await createOrReadSeed(id)
  sharedStateObject.wallet = await createNewWallet(sharedStateObject.hdkey, sharedStateObject.purpose, sharedStateObject.coinType, o_options, sharedStateObject.addrType, sharedStateObject.id)

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
