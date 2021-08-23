import smartMeterInit from "./src/doichain/smartMeterInit.js"
import { readFile } from 'fs/promises';
import transportLocalFile from "./src/doichain/test/transportLocalFile.js"


const main = async () => {
  const settingsTable = JSON.parse(await readFile(new URL('./settings.json', import.meta.url)));

  const options = settingsTable.options  

  const doichainRpcClient = settingsTable.doichain;
  const credentials = doichainRpcClient.username + ':' + doichainRpcClient.password;
  global.url = 'http://' + credentials + '@' + doichainRpcClient.host + ':' + doichainRpcClient.port

  transportLocalFile(options.transportLocalFilePath);

  smartMeterInit(options) 
}

main()
