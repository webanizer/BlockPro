import SmartmeterObis from "smartmeter-obis"
import writeToIPFS from './ipfs.js'
import { publish } from '../p2p/publish.js'
import { s } from '../p2p/sharedState.js'

import ipfs from "ipfs-core";
s.ipfs = await ipfs.create()


const smartMeterInit = async (options, topic) => {
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

    console.info('writing data into ipfs')

    let eigeneCid = await writeToIPFS(s.ipfs, stringJSON)
    s.eigeneCID = eigeneCid.toString()
    
    console.info('__eigeneCID', s.eigeneCID) 
    let publishString = "Z " + s.eigeneCID.toString()
    await publish(publishString, topic) 
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
