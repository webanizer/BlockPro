

import { readFile } from 'fs/promises';
import smartMeterInit from "../src/smartMeterInit.js"
import transportLocalFile from "./transportLocalFile.js"
import mock from "mock-require";
mock("serialport", "virtual-serialport")

describe("Integrationstest", function () {
  beforeEach(() => {})
  afterEach(() => {})

  it("started SmartmeterObis process", async function () {
    const settingsTable = JSON.parse(await readFile(new URL('../settings-test.json', import.meta.url)));

    const options = settingsTable.options;
    const doichainRpcClient = settingsTable.doichain;
    const credentials = doichainRpcClient.username + ':' + doichainRpcClient.password;
    global.url = 'http://' + credentials + '@' + doichainRpcClient.host + ':' + doichainRpcClient.port

    transportLocalFile(options.transportLocalFilePath);
    console.log("___options", options);
    smartMeterInit(options);
  });
})