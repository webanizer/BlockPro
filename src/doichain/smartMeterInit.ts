import SmartmeterObis from "smartmeter-obis"
import writeToIPFS from './ipfs.js'
import { publish } from '../p2p/publish.js'
import { s } from '../p2p/sharedState.js'

import ipfs from "ipfs-core";
// @ts-expect-error ts-migrate(2339) FIXME: Property 'ipfs' does not exist on type '{}'.
s.ipfs = await ipfs.create()


const smartMeterInit = async (options: any, topic: any) => {
  new Promise((resolve, reject) => {

  console.log("started reading consolino meter");

  const smlToIpfs = async (err: any, obisResult: any) => {  
  
    let obisJSON = { }

    if (err) {
      console.error('err', err)      
      return;
    }    
    
    for (let obisId in obisResult) {    
        // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
        obisJSON[obisResult[obisId].idToString()] = obisResult[obisId].valueToString()
    }

    // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
    obisJSON["timestamp"] = Date.now()
    let stringJSON = JSON.stringify(obisJSON)
    // console.log("__tringJSON", stringJSON)

    console.info('writing data into ipfs')

    // @ts-expect-error ts-migrate(2339) FIXME: Property 'eigeneCID' does not exist on type '{}'.
    s.eigeneCID = await writeToIPFS(s.ipfs, stringJSON)
    
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'eigeneCID' does not exist on type '{}'.
    console.info('__eigeneCID', s.eigeneCID) 
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'eigeneCID' does not exist on type '{}'.
    let publishString = s.eigeneCID.toString()
    await publish(publishString, topic) 
    // @ts-expect-error ts-migrate(2794) FIXME: Expected 1 arguments, but got 0. Did you forget to... Remove this comment to see the full error message
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
