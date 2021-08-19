import * as smartMeterInit from "./src/smartMeterInit"
const readFile = require('fs/promises');
const fs = require('fs').promises;
declare var url: string;

const main = async () => {
  const settingsTable = JSON.parse(await fs.readFile(new URL('./settings.json', import.meta.url)));

  const options = settingsTable.options  

  const doichainRpcClient = settingsTable.doichain;
  const credentials = doichainRpcClient.username + ':' + doichainRpcClient.password;

  url = 'http://' + credentials + '@' + doichainRpcClient.host + ':' + doichainRpcClient.port

   smartMeterInit(options) 
}

main()
