import {DOICHAIN_REGTEST} from "./network";
const bitcoin = require('bitcoinjs-lib')
const getPrivateKeyFromWif = (wif,network) => {
    if (!network) network = global.DEFAULT_NETWORK
    const keyPair = bitcoin.ECPair.fromWIF(wif,network)
    return keyPair.privateKey.toString('hex')
}

export default getPrivateKeyFromWif
