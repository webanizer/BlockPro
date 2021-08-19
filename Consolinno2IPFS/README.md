# Consolino2IPFS

## Description
1. Reads data from Consolino via serial port
2. Creates a sha256 hash of these data
3. Writes the data straight to a running js-ipfs node
4. Stores a Proof-Of-Existence (PoE) on Doichain via RPC - name_doi 

## Getting started
1. Checkout this repo
2. run ```npm install```
3. Add your passwords
      - In settings.json add doichain mainnet password from .doichain/doichain.conf
      - In src/sendNotification.js add smtp address, password and username
4. run ```npm start```
5. to run modular tests:
      - ```npm run test:module```
      - Reads data from test file instead of meter
      - Runs test/test.js
      - Writes hash and Cid to Doichain regtest instead of main net
6. to run integration tests: 
      - ```npm run test:functional```
      - Sets an environment variable to use Regtest mode
      - Then starts up docker container with doichain-node in regtest-mode
      - Runs /test/index.test.js


### Offene Fragen
1. Welche Daten müssen wir tatsächlich speichern? Verbraucht und produziert:
	1.8.0 und 2.8.0
	einspeisen und verbrauchen
2. Warum gibt es einen public key? Bereit für netzwerk? 
      digital ambus
3. Wie rechnen wir Differenz aus und wo? Menge von 15 min
	evtl Blockexplorer der die Stromverbräuche ausrechnet zusätzlich zu Transaktionen
	Differenz zwischen Verbrauch und Produktion
	mit geographischen Daten/ Public key Wallet oder Zähler
4. Kann der Zähler selber seinen Stand in der Doichain speichern? Mit seinem Public Key
5. Nur CID statt hash, erst cid als name und hash als value?


### Resources
1. Serial Port npm package https://www.npmjs.com/package/serialport
2. Example on how to call the RPC on Doichain 
    - getblockcount https://github.com/Doichain/meteor-api/blob/e6bfd0a3ac74b0c1ffdbcd019488deab4d3c4c28/server/api/doichain.js#L223
    - listtransactions https://github.com/Doichain/meteor-api/blob/e6bfd0a3ac74b0c1ffdbcd019488deab4d3c4c28/server/api/doichain.js#L260
    - the rpc-client implementation https://github.com/Doichain/meteor-api/blob/e6bfd0a3ac74b0c1ffdbcd019488deab4d3c4c28/imports/startup/server/doichain-configuration.js
    - namecoin rpc lib - https://www.npmjs.com/package/namecoin 