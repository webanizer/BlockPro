import SmartmeterObis from "smartmeter-obis"
import writeToIPFS from './writeToIPFS.js'
import { publish } from '../p2p/publish.js'
import { s } from '../p2p/sharedState.js'
import { createRequire } from "module";
const require = createRequire(import.meta.url);


const smartMeterInit = async (options, topicQuiz) => {
  new Promise((resolve, reject) => {

    console.log("started reading consolino meter");

    const smlToIpfs = async (err, obisResult) => {

      let obisJSON = {}

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

      let eigeneCid = await writeToIPFS(stringJSON)
      s.eigeneCID = eigeneCid.toString()

      console.info('__eigeneCID', s.eigeneCID)
      let publishString = "Z " + `${s.id}, ${s.eigeneCID}` 
      await publish(publishString, topicQuiz)
      resolve()
    }

    let smTransport = SmartmeterObis.init(options, smlToIpfs)
    console.log("started SmartmeterObis process");
    smTransport.process();
    console.log("end SmartmeterObis process");
    setTimeout(smTransport.stop, 28000);

  })
}

export default smartMeterInit
