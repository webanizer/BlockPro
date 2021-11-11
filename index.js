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
import createAndSendTransaction from "./src/doichainjs-lib/lib/createAndSendTransaction.js";
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

  node = await createNode(id)

  await peerDiscovery(node)

  id = id.toB58String()

  global.DEFAULT_NETWORK = network.DOICHAIN_TESTNET
  let o_options

  // check if seed file is available

  let addrType = "legacy"
  let purpose
  switch (addrType){
    case "legacy": 
      purpose = "m/44"
      break;
    case "p2sh":
      purpose = "m/49"
      break;
    case "p2wpkh":
      purpose = "m/84"
      break;
  }

  let coinType = global.DEFAULT_NETWORK.name == "mainnet" ? 0 : 1

  await createOrReadSeed()
  global.wallet = await createNewWallet(hdkey, purpose, coinType, o_options, addrType)
  let amount = 0
  let destAddress
  let our_wallet = wallet
  let nameId
  let nameValue
  let encryptedTemplateData

  const txResponse = await createAndSendTransaction(seed,
    password,
    amount,
    destAddress,
    our_wallet,
    nameId,
    nameValue,
    encryptedTemplateData)
console.log("txResponse", txResponse)

  function getWinnerPeerId() {
    if (peerIdConf.includes('id-1')) {
      firstPeer = true
      quiz(node, id, firstPeer)
    } else {
      firstPeer = false
      quiz(node, id, firstPeer)
    }
  }

  getWinnerPeerId()
}

main()
