// @ts-expect-error ts-migrate(2305) FIXME: Module '"module"' has no exported member 'createRe... Remove this comment to see the full error message
import { createRequire } from "module"; 
// @ts-expect-error ts-migrate(2441) FIXME: Duplicate identifier 'require'. Compiler reserves ... Remove this comment to see the full error message
const require = createRequire(import.meta.url); 
import settings from './settings.js'
// @ts-expect-error ts-migrate(7005) FIXME: Variable 'network' implicitly has an 'any' type.
export var network
// @ts-expect-error ts-migrate(7005) FIXME: Variable 'DEFAULT_NETWORK' implicitly has an 'any'... Remove this comment to see the full error message
export var DEFAULT_NETWORK
// @ts-expect-error ts-migrate(7005) FIXME: Variable 'DEFAULT_SETTINGS' implicitly has an 'any... Remove this comment to see the full error message
export var DEFAULT_SETTINGS
// @ts-expect-error ts-migrate(2339) FIXME: Property 'network' does not exist on type 'Global'... Remove this comment to see the full error message
global.network = network
// @ts-expect-error ts-migrate(2339) FIXME: Property 'DEFAULT_NETWORK' does not exist on type ... Remove this comment to see the full error message
global.DEFAULT_NETWORK = DEFAULT_NETWORK
// @ts-expect-error ts-migrate(2339) FIXME: Property 'DEFAULT_SETTINGS' does not exist on type... Remove this comment to see the full error message
global.DEFAULT_SETTINGS = DEFAULT_SETTINGS 
const ElectrumClient = require("@codewarriorr/electrum-client-js")

export const DOICHAIN = {
    name: 'mainnet',
    messagePrefix: '\x19Doichain Signed Message:\n',
    bech32: 'dc',
    bip32: {
        public: 0x0488b21e,
        private: 0x0488ade4
    },
    pubKeyHash: 52, //D=30 d=90 (52=M) https://en.bitcoin.it/wiki/List_of_address_prefixes
    scriptHash: 13,
    wif: 180, //???
};

export const DOICHAIN_TESTNET = {
    name: 'testnet',
    messagePrefix: '\x19Doichain-Testnet Signed Message:\n',
    bech32: 'td',
    bip32: {
        public: 0x043587CF,
        private: 0x04358394
    },
    pubKeyHash: 111, //D=30 d=90 (52=N) (111=m/n) https://en.bitcoin.it/wiki/List_of_address_prefixes
    scriptHash: 196,
    wif: 239, //???
};

export const DOICHAIN_REGTEST = {  
    name: "regtest",
    messagePrefix: "\x19Doichain-Regtest Signed Message:\n",
    bech32: "ncrt",
    bip32: {
      public: 0x043587cf,
      private: 0x04358394,
    },
    pubKeyHash: 111,
    scriptHash: 196,
    wif: 239,
  };

const settingsMainnet = {
    testnet: false,
    from: "validator@doichain.org",
    ssl: true,
    port: 443,
    host: "empty-robin-671603898356952.doi.works"
}

const settingsTestnet = {
    testnet: true,
    from: "validator-testnet@doichain.org",
    port: 443,
    ssl: true,
    host: "doichain-testnet.le-space.de"
}

const settingsRegTest = {
    regtest: true,
    from: "alice@ci-doichain.org",
    port: 3000,
    host: "localhost"
}

export const changeNetwork = (newNetwork: any) => {
    var GLOBAL = global || window;
    //console.log('newNetwork:'+newNetwork)
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'network' does not exist on type 'Global'... Remove this comment to see the full error message
    if(!newNetwork || newNetwork === undefined) GLOBAL.network == "mainnet"
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'network' does not exist on type 'Global'... Remove this comment to see the full error message
    else GLOBAL.network = newNetwork

    // @ts-expect-error ts-migrate(2339) FIXME: Property 'network' does not exist on type 'Global'... Remove this comment to see the full error message
    if (GLOBAL.network === "mainnet") {
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'DEFAULT_NETWORK' does not exist on type ... Remove this comment to see the full error message
        GLOBAL.DEFAULT_NETWORK = DOICHAIN
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'DEFAULT_SETTINGS' does not exist on type... Remove this comment to see the full error message
        GLOBAL.DEFAULT_SETTINGS = settingsMainnet
    }
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'network' does not exist on type 'Global'... Remove this comment to see the full error message
    else if (GLOBAL.network === "testnet") {
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'DEFAULT_NETWORK' does not exist on type ... Remove this comment to see the full error message
        GLOBAL.DEFAULT_NETWORK = DOICHAIN_TESTNET
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'DEFAULT_SETTINGS' does not exist on type... Remove this comment to see the full error message
        GLOBAL.DEFAULT_SETTINGS = settingsTestnet
    }
    else {
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'network' does not exist on type 'Global'... Remove this comment to see the full error message
        GLOBAL.network = "regtest"
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'DEFAULT_NETWORK' does not exist on type ... Remove this comment to see the full error message
        GLOBAL.DEFAULT_NETWORK = DOICHAIN_REGTEST
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'DEFAULT_SETTINGS' does not exist on type... Remove this comment to see the full error message
        GLOBAL.DEFAULT_SETTINGS = settingsRegTest
    }
   // console.info('changed network to',GLOBAL.network)
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'DEFAULT_SETTINGS' does not exist on type... Remove this comment to see the full error message
    settings.setSettings(GLOBAL.DEFAULT_SETTINGS)
}


export const getElectrumClient = (setSettings = []) => {
    settings.setSettings(setSettings)

    return new ElectrumClient(
        settings.electrumHost,
        settings.electrumPort,
        settings.electrumSSL
    )
}
