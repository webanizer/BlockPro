import smartMeterInit from "./src/smartMeterInit.js"
import { readFile } from 'fs/promises';


const main = async () => {
  const settingsTable = JSON.parse(await readFile(new URL('./settings.json', import.meta.url)));

  const options = settingsTable.options  

  const doichainRpcClient = settingsTable.doichain;
  const credentials = doichainRpcClient.username + ':' + doichainRpcClient.password;
  global.url = 'http://' + credentials + '@' + doichainRpcClient.host + ':' + doichainRpcClient.port

   smartMeterInit(options) 
}

main()
