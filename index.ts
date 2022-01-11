// @ts-expect-error ts-migrate(2305) FIXME: Module '"module"' has no exported member 'createRe... Remove this comment to see the full error message
import { createRequire } from "module"; 
// @ts-expect-error ts-migrate(2441) FIXME: Duplicate identifier 'require'. Compiler reserves ... Remove this comment to see the full error message
const require = createRequire(import.meta.url); 
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module 'fs/promises' or its correspond... Remove this comment to see the full error message
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
import { DEFAULT_NETWORK } from "./src/doichainjs-lib/lib/network.js";

var peerIdConf: any
var id
var node
var firstPeer


const main = async () => {
  // @ts-expect-error ts-migrate(1343) FIXME: The 'import.meta' meta-property is only allowed wh... Remove this comment to see the full error message
  const settingsTable = JSON.parse(await readFile(new URL('./settings.json', import.meta.url)));

  // @ts-expect-error ts-migrate(2339) FIXME: Property 'options' does not exist on type 'Global'... Remove this comment to see the full error message
  global.options = settingsTable.options

  const doichainRpcClient = settingsTable.doichain;
  const credentials = doichainRpcClient.username + ':' + doichainRpcClient.password;
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'url' does not exist on type 'Global'.
  global.url = 'http://' + credentials + '@' + doichainRpcClient.host + ':' + doichainRpcClient.port

  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'options'.
  transportLocalFile(options.transportLocalFilePath);

  // Start Quiz
  console.info('Starting p2p Quiz')

  peerIdConf = process.env.PEER;

  id = await createOrReadPeerId(peerIdConf)

  // @ts-expect-error ts-migrate(2339) FIXME: Property 'node' does not exist on type '{}'.
  s.node = await createNode(id)

  // @ts-expect-error ts-migrate(2339) FIXME: Property 'node' does not exist on type '{}'.
  await peerDiscovery(s.node)

  // @ts-expect-error ts-migrate(2339) FIXME: Property 'id' does not exist on type '{}'.
  s.id = id.toB58String()
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'network' does not exist on type '{}'.
  s.network = network.DOICHAIN_TESTNET

  // @ts-expect-error ts-migrate(2339) FIXME: Property 'DEFAULT_NETWORK' does not exist on type ... Remove this comment to see the full error message
  global.DEFAULT_NETWORK = network.DOICHAIN_TESTNET

  let o_options

  // check if seed file is available

  // @ts-expect-error ts-migrate(2339) FIXME: Property 'addrType' does not exist on type '{}'.
  s.addrType = "p2wpkh"

  // @ts-expect-error ts-migrate(2339) FIXME: Property 'addrType' does not exist on type '{}'.
  switch (s.addrType){
    case "legacy": 
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'purpose' does not exist on type '{}'.
      s.purpose = "m/44"
      break;
    case "p2sh":
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'purpose' does not exist on type '{}'.
      s.purpose = "m/49"
      break;
    case "p2wpkh":
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'purpose' does not exist on type '{}'.
      s.purpose = "m/84"
      break;
  }

  // @ts-expect-error ts-migrate(2339) FIXME: Property 'coinType' does not exist on type '{}'.
  s.coinType = global.DEFAULT_NETWORK.name == "mainnet" ? 0 : 1
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'account' does not exist on type '{}'.
  s.account = 0 
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'basePath' does not exist on type '{}'.
  s.basePath = `${s.purpose}/${s.coinType}/${s.account}`
  
  await createOrReadSeed(id)
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'wallet' does not exist on type '{}'.
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
