

// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module 'fs/promises' or its correspond... Remove this comment to see the full error message
import { readFile } from 'fs/promises';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '../src/smartMeterInit.js' or i... Remove this comment to see the full error message
import smartMeterInit from "../src/smartMeterInit.js"
import transportLocalFile from "./transportLocalFile.js"
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'mock... Remove this comment to see the full error message
import mock from "mock-require";
mock("serialport", "virtual-serialport")

// @ts-expect-error ts-migrate(2582) FIXME: Cannot find name 'describe'. Do you need to instal... Remove this comment to see the full error message
describe("Integrationstest", function () {
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'beforeEach'.
  beforeEach(() => {})
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'afterEach'.
  afterEach(() => {})

  // @ts-expect-error ts-migrate(2582) FIXME: Cannot find name 'it'. Do you need to install type... Remove this comment to see the full error message
  it("started SmartmeterObis process", async function () {
    // @ts-expect-error ts-migrate(1343) FIXME: The 'import.meta' meta-property is only allowed wh... Remove this comment to see the full error message
    const settingsTable = JSON.parse(await readFile(new URL('../settings-test.json', import.meta.url)));

    const options = settingsTable.options;
    const doichainRpcClient = settingsTable.doichain;
    const credentials = doichainRpcClient.username + ':' + doichainRpcClient.password;
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'url' does not exist on type 'Global'.
    global.url = 'http://' + credentials + '@' + doichainRpcClient.host + ':' + doichainRpcClient.port

    transportLocalFile(options.transportLocalFilePath);
    console.log("___options", options);
    smartMeterInit(options);
  });
})