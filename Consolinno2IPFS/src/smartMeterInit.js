import smlToIpfs from "./smlToIpfs.js"
import SmartmeterObis from "smartmeter-obis"

import ipfs from "ipfs-core";
global.ipfs = await ipfs.create()

const smartMeterInit = async (options) => {
  console.log("started reading consolino meter");
  let smTransport = SmartmeterObis.init(options, smlToIpfs)
  console.log("started SmartmeterObis process");
  smTransport.process();
  console.log("end SmartmeterObis process");
  setTimeout(smTransport.stop, 60000);
}

export default smartMeterInit
