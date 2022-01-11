import fs from "fs"
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module 'fs/promises' or its correspond... Remove this comment to see the full error message
import { readFile } from 'fs/promises';
import chai from "chai"
import chaiHttp from 'chai-http';
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'mock... Remove this comment to see the full error message
import mock from "mock-require";

// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'sha2... Remove this comment to see the full error message
import sha256 from "sha256"
const expect = chai.expect

mock("serialport", "virtual-serialport")
import SmartmeterObis from "smartmeter-obis"

import IPFS from 'ipfs'
import uint8ArrayConcat from 'uint8arrays/concat.js'
import uint8ArrayToString from 'uint8arrays/to-string.js'
import all from 'it-all'


// @ts-expect-error ts-migrate(1378) FIXME: Top-level 'await' expressions are only allowed whe... Remove this comment to see the full error message
const settingsTable = JSON.parse(await readFile(new URL('../settings-test.json', import.meta.url)));

const doichainRpcClient = settingsTable.doichain;
const credentials = doichainRpcClient.username + ':' + doichainRpcClient.password;
// @ts-expect-error ts-migrate(2339) FIXME: Property 'url' does not exist on type 'Global'.
global.url = 'http://' + credentials + '@' + doichainRpcClient.host + ':' + doichainRpcClient.port

// @ts-expect-error ts-migrate(2582) FIXME: Cannot find name 'describe'. Do you need to instal... Remove this comment to see the full error message
describe("Basic module tests", function () {

  // @ts-expect-error ts-migrate(2582) FIXME: Cannot find name 'it'. Do you need to install type... Remove this comment to see the full error message
  it("should create hash over test SML file", function(this: any, done: any) {
    this.timeout(60000); // because of first install from npm    

    var options = {
      protocol: "D0Protocol",
      transport: "LocalFileTransport",
      transportSerialPort: "/dev/ir-usb0",
      transportSerialBaudrate: 9600,
      requestInterval: 10,
      transportHttpRequestUrl: "",
      obisNameLanguage: "en",
      transportLocalFilePath: "./test.d0",
      obisFallbackMedium: 6
    };

    var testData =
      "/?Bla0!\r\n6.8(0029.055*MWh)6.26(01589.28*m3)9.21(00010213)6.26*01(01563.92*m3)6.8*01(0028.086*MWh)F(0)9.20(64030874)6.35(60*m)6.6(0017.2*kW)6.6*01(0017.2*kW)6.33(001.476*m3ph)9.4(088*C&082*C)6.31(0030710*h)6.32(0000194*h)9.22(R)9.6(000&00010213&0)9.7(20000)6.32*01(0000194*h)6.36(01-01)6.33*01(001.476*m3ph)6.8.1()6.8.2()6.8.3()6.8.4()6.8.5()6.8.1*01()6.8.2*01()6.8.3*01()\r\n6.8.4*01()6.8.5*01()9.4*01(088*C&082*C)6.36.1(2013-11-28)6.36.1*01(2013-11-28)6.36.2(2016-09-24)6.36.2*01(2016-09-24)6.36.3(2015-03-26)6.36.3*01(2015-03-26)6.36.4(2013-09-27)6.36.4*01(2013-09-27)6.36.5(2000-00-00)6.36*02(01)9.36(2017-01-18&01:36:47)9.24(0.6*m3ph)9.17(0)9.18()9.19()9.25()9.1(0&1&0&-&CV&3&2.14)9.2(&&)0.0(00010213)!\r\n";
    fs.writeFileSync(options.transportLocalFilePath, testData);

    var lastObisResult: any;
    var counter = 0;
    var errCounter = 0;
    let obisJSON = {};

    function testStoreData(err: any, obisResult: any) {
      if (err) {
        expect(obisResult).to.be.null;
        errCounter++;
        console.log("ERROR: " + err);
        return;
      }
      // nothing to do in this case because protocol is stateless

      expect(obisResult).to.be.an("object");
      expect(obisResult["6-0:9.20"]).to.be.an("object");
      expect(obisResult["6-0:9.20"].rawValue).to.be.equal("64030874");
      expect(obisResult["6-0:9.20"].values.length).to.be.equal(1);
      expect(obisResult["6-0:9.20"].values[0].value).to.be.equal(64030874);
      expect(obisResult["6-0:6.8"]).to.be.an("object");
      expect(obisResult["6-0:6.8"].rawValue).to.be.equal("0029.055*MWh");
      expect(obisResult["6-0:6.8"].values.length).to.be.equal(1);
      expect(obisResult["6-0:6.8"].values[0].value).to.be.equal(29.055);
      expect(obisResult["6-0:6.8"].values[0].unit).to.be.equal("MWh");

      if (!lastObisResult) {
        expect(counter).to.be.equal(0);
      } else {
        expect(counter).to.be.equal(1);
        expect(JSON.stringify(lastObisResult)).to.be.equal(
          JSON.stringify(obisResult)
        );
      }

      lastObisResult = obisResult;
      counter++;
      for (var obisId in obisResult) {
        obisResult[obisId].idToString() +
          ": " +
          SmartmeterObis.ObisNames.resolveObisName(
            obisResult[obisId],
            // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'string' is not assignable to par... Remove this comment to see the full error message
            options.obisNameLanguage
          ).obisName +
          " = " +
          obisResult[obisId].valueToString();

        // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
        obisJSON[obisResult[obisId].idToString()] =
          obisResult[obisId].valueToString();
      }
      //obisJSON["timestamp"] = Date.now();
      let stringJSON = JSON.stringify(obisJSON);


      // @ts-expect-error ts-migrate(2339) FIXME: Property 'testHash' does not exist on type 'Global... Remove this comment to see the full error message
      global.testHash = sha256(stringJSON);

      let expectedHash = 'ad535182fc0af8e4e602c9f21ca887317aaf17b09e5f980d530b2694fc5d7e12';
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'testHash'.
      expect(testHash.toString()).to.equal(expectedHash);
    }

    // @ts-expect-error ts-migrate(2345) FIXME: Argument of type '{ protocol: string; transport: s... Remove this comment to see the full error message
    var smTransport = SmartmeterObis.init(options, testStoreData);

    smTransport.process();

    setTimeout(function () {
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'stopRequests' does not exist on type 'Ob... Remove this comment to see the full error message
      expect(smTransport.stopRequests).to.be.false;
      smTransport.stop(function () {
        expect(counter).to.be.equal(2);
        expect(errCounter).to.be.equal(0);
        fs.unlinkSync(options.transportLocalFilePath);
        done();
      });
    }, 13000);
  })

  // @ts-expect-error ts-migrate(2582) FIXME: Cannot find name 'it'. Do you need to install type... Remove this comment to see the full error message
  it("should add testHash to ipfs and return it", async () => {
    //let testHash = "ad535182fc0af8e4e602c9f21ca887317aaf17b09e5f980d530b2694fc5d7e12"  
    const ipfs = await IPFS.create()
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'testHash'.
    const { cid } = await ipfs.add(testHash);

    expect(cid).to.be.not.empty
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'testCid' does not exist on type 'Global'... Remove this comment to see the full error message
    global.testCid = cid.toString();

    const data = uint8ArrayConcat(await all(ipfs.cat(cid)))
    const returnedHash = uint8ArrayToString(data)
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'testHash'.
    expect(returnedHash).to.contain(testHash)
    await ipfs.stop();

  });

  // Test der RPC calls zur Doichain im Regtestmodus
  chai.use(chaiHttp);

  // @ts-expect-error ts-migrate(2582) FIXME: Cannot find name 'it'. Do you need to install type... Remove this comment to see the full error message
  it('should generate a new address with RPC', (done: any) => {
    chai
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'url'.
      .request(url)
      .post("/")
      .send({
        method: 'getnewaddress'
      })
      .end((err, res) => {
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'statusCode' does not exist on type 'Resp... Remove this comment to see the full error message
        expect(res.statusCode).to.equal(200)
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'address' does not exist on type 'Global'... Remove this comment to see the full error message
        global.address = res.body.result;
        console.log(err)
        done();
      });
  });

  // @ts-expect-error ts-migrate(2582) FIXME: Cannot find name 'it'. Do you need to install type... Remove this comment to see the full error message
  it('Should generate 101 Blocks to the new address', (done: any) => {
    chai
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'url'.
      .request(url)
      .post("/")
      .send({
        method: 'generatetoaddress',
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'address' does not exist on type 'Global'... Remove this comment to see the full error message
        params: [101, global.address]
      })
      .end((err, res) => {
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'statusCode' does not exist on type 'Resp... Remove this comment to see the full error message
        expect(res.statusCode).to.equal(200)
        console.log(err)
        done();
      })
  });

  // @ts-expect-error ts-migrate(2582) FIXME: Cannot find name 'it'. Do you need to install type... Remove this comment to see the full error message
  it('should affirm new balance must be at least 50.0 Doi', (done: any) => {
    chai
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'url'.
      .request(url)
      .post("/")
      .send({
        method: 'getbalance',
      })
      .end((err, res) => {
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'statusCode' does not exist on type 'Resp... Remove this comment to see the full error message
        expect(res.statusCode).to.equal(200)
        let balance = parseInt(res.body.result);
        expect(balance).to.be.gte(50)
        console.log(err)
        done();
      })
  })

  // @ts-expect-error ts-migrate(2582) FIXME: Cannot find name 'it'. Do you need to install type... Remove this comment to see the full error message
  it('should return name_doi txid with status 200', (done: any) => {
    chai
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'url'.
      .request(url)
      .post("/")
      .send({
        method: 'name_doi',
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'testHash' does not exist on type 'Global... Remove this comment to see the full error message
        params: [global.testHash, global.testCid]
      })
      .end((err, res) => {
        expect(res).to.have.status(200)
        console.log(err)
        done();
      })
  })

  // @ts-expect-error ts-migrate(2582) FIXME: Cannot find name 'it'. Do you need to install type... Remove this comment to see the full error message
  it('should generate 1 Block to validate name_doi', (done: any) => {
    chai
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'url'.
      .request(url)
      .post("/")
      .send({
        method: 'generatetoaddress',
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'address' does not exist on type 'Global'... Remove this comment to see the full error message
        params: [1, global.address]
      })
      .end((err, res) => {
        expect(res).to.have.status(200)
        console.log(err)
        done();
      })
  })


  // @ts-expect-error ts-migrate(2582) FIXME: Cannot find name 'it'. Do you need to install type... Remove this comment to see the full error message
  it('should return the saved hash with name_show', (done: any) => {
    chai
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'url'.
      .request(url)
      .post("/")
      .send({
        method: 'name_show',
        // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'testHash'.
        params: [testHash]
      })
      .end((err, res) => {
        expect(res).to.have.status(200)
        console.log(err)
        done();
      })
  });
});

