import { readFile } from 'fs/promises';
import transportLocalFile from "./src/doichain/test/transportLocalFile.js"
import createOrReadPeerId from './src/p2p/createOrReadPeerId.js'
import createNode from './src/p2p/createNode.js'
import peerDiscovery from './src/p2p/peerDiscovery.js'
import quiz from './src/p2p/quiz.js'
import { createOrReadSeed } from "./src/p2p/createOrReadSeed.js";
import { network } from 'doichainjs-lib';
import { createNewWallet } from "doichainjs-lib";
import { s } from "./src/p2p/sharedState.js";
import { createRequire } from "module";
import OrbitDb from 'orbit-db';
const require = createRequire(import.meta.url);
const ElectrumClient = require('@codewarriorr/electrum-client-js')
import 'dotenv/config'
const ORBIT_DB = process.env.ORBIT_DB
const NETWORK_TYPE = process.env.NETWORK_TYPE
const IPFS = require('ipfs')
import bootstrapers from './src/p2p/peerIds/bootstrapers.js'
import all from 'it-all'
import { listenToMQTT } from './src/doichain/mqtt.js';



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

  await listenToMQTT()

  //var peerIdConf = process.env.PEER;
  var id = await createOrReadPeerId(peerIdConf)

  var ipfsPath
  switch (process.env.PEER) {
    case "./peerIds/id-1.json":
      ipfsPath = "./ipfs1"
      break;
    case "./peerIds/id-2.json":
      ipfsPath = "./ipfs2"
      break;
    case "./peerIds/id-2.json":
      ipfsPath = "./ipfs3"
      break;
  }

  s.node = await IPFS.create({
    repo: ipfsPath,
    peerId: id,
    start: true,
    EXPERIMENTAL: {
      pubsub: true,
    },
    config: {
      Bootstrap: bootstrapers
    }
  })

  const peers = await s.node.swarm.peers()
  console.log(`The node now has ${peers.length} peers.`)

  // id = await createOrReadPeerId(peerIdConf)

  // s.node = await createNode(id)

  // await peerDiscovery(s.node)

  s.id = id.toB58String()
  s.network = network[NETWORK_TYPE]

  global.DEFAULT_NETWORK = network[NETWORK_TYPE]
  var electrumHost

  switch (NETWORK_TYPE) {
    case "DOICHAIN":
      electrumHost = "itchy-jellyfish-89.doi.works"
      break;
    case "DOICHAIN_TESTNET":
      electrumHost = "spotty-goat-4.doi.works"
      break;
    case "DOICHAIN_REGTEST":
      electrumHost = "172.22.0.6"
      break;
  }
  // with regtest start doichaind with -acceptnonstdtxn

  let o_options

  // check if seed file is available

  s.addrType = "p2wpkh"

  switch (s.addrType) {
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

  global.client = new ElectrumClient(electrumHost, 50002, "ssl");
  try {
    await global.client.connect(
      "electrum-client-js", // optional client name
      "1.4.2" // optional protocol version
    )
  } catch (err) {
    console.error(err);
  }

  await createOrReadSeed(id)
  s.wallet = await createNewWallet(s.hdkey, s.purpose, s.coinType, o_options, s.addrType, s.id)

  if (ORBIT_DB !== "") {
    // Create OrbictDB
    s.orbitDb = await OrbitDb.createInstance(s.node, { directory: './orbitdb1' })

    // Create docstore DB
    s.docstore = await s.orbitDb.open(ORBIT_DB);
    console.log("Successfully created docstore");

    await s.docstore.load()

    await s.docstore.events.on('replicated', async (address) => {
      console.log("Replicated Database")
    })

    await s.docstore.events.on('replicate.progress', async (address, hash, entry, progress, have) => {
      let replizierteDaten = entry.payload.value

      // Wenn replizierte Daten eine EnergieDock Buchung sind, dann CID pinnen
      if (replizierteDaten.cid !== undefined) {
        let buchungsCid = replizierteDaten.cid

        // pin Cid der Buchung
        await s.node.pin.add(buchungsCid, true)
        const pinset = await all(s.node.pin.ls({
          paths: buchungsCid
        }))

        // Assure that current cid was pinned
        if (pinset.length < 1) {
          throw 'Cid was not pinned';
        }

        console.log("Pinned Buchungs CID der Schnittstelle")
      }
    })
  }

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
