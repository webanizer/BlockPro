import SmartmeterObis from "smartmeter-obis"
import sha256 from 'sha256'
import writeToIPFS from './ipfs.js'
import  publishZählerstand from '../p2p/publishZaehlerstand.js'

import ipfs from "ipfs-core";
global.ipfs = await ipfs.create()


const smartMeterInit = async (options, node, id, topic) => {
  new Promise((resolve, reject) => {

  console.log("started reading consolino meter");

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
    // console.log("__tringJSON", stringJSON)

    console.log('creating sha256 hash over data')
    global.hash = undefined
    global.hash = sha256(stringJSON)
    console.info('__our hash', hash)

    console.info('writing data into ipfs')

    global.eigeneCID = await writeToIPFS(global.ipfs, stringJSON)
    
    console.info('__eigeneCID', eigeneCID) 
    publishZählerstand(node, eigeneCID, id, topic) 
    resolve()
  }

  let smTransport =  SmartmeterObis.init(options, smlToIpfs)
  console.log("started SmartmeterObis process");
  smTransport.process();
  console.log("end SmartmeterObis process");
  setTimeout(smTransport.stop, 28000);

  })
}

export default smartMeterInit
