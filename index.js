import { createRequire } from "module"; // Bring in the ability to create the 'require' method
const require = createRequire(import.meta.url); // construct the require method
import { readFile } from 'fs/promises';
import transportLocalFile from "./src/doichain/test/transportLocalFile.js"
import createOrReadPeerId from './src/p2p/createOrReadPeerId.js'
import createNode from './src/p2p/createNode.js'
import peerDiscovery from './src/p2p/peerDiscovery.js'
import quiz from './src/p2p/quiz.js'
import { generateMnemonic } from './src/doichainjs-lib/lib/generateMnemonic.js'
import { createHdKeyFromMnemonic, encryptAES, decryptAES, network  } from './src/doichainjs-lib/index.js';
var fs = require('fs');
import { createNewWallet } from "./src/doichainjs-lib/lib/createNewWallet.js";
import createAndSendTransaction from "./src/doichainjs-lib/lib/createAndSendTransaction.js";

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

  global.DEFAULT_NETWORK = network.TESTNET

  var password1

  const password = password1 ? password1 : "mnemonic"

  // check if seed file is available

  try {
    if ( fs.existsSync("./encryptedS.txt")) {
      console.log("Seed phrase exists")
      fs.readFile('./encryptedS.txt', 'utf8', function(err, data){
        global.seed = decryptAES(data, password)
        // generate hd key 
        global.hdkey = createHdKeyFromMnemonic(seed, password)
        console.log("Read Existing Seed from storage");

        global.wallet = await createNewWallet(hdkey, 39, )
    });
    }
  } catch(err) {
    console.log("No Seed yet. Creating new one")

    global.seed = generateMnemonic();

    // generate hd key and encrypt with password
    global.hdkey = createHdKeyFromMnemonic(seed, password)
    const encryptedS = encryptAES(seed, password)


    global.wallet = await createNewWallet(hdkey, 39, )

    // save in local file 

    fs.writeFile('encryptedS.txt', `${encryptedS}`, function (err) {
      if (err) throw err;
      console.log('Saved new encrypted seed phrase!');
    });
  }

  let nameId = "cid"
  let nameValue = "hash"

  const txResponse = await createAndSendTransaction(seed,
          password,
          wallet,
          nameId,
          nameValue)
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
