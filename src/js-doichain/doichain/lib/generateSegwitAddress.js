const bitcoin = require('bitcoinjs-lib')

export const generateSegwitAddress = (publicExtendedKey, derivationPath, network) => {
    
    if(!network) network =  global.DEFAULT_NETWORK
    let childKey0FromXpub = bitcoin.bip32.fromBase58(publicExtendedKey,network);

    let address = bitcoin.payments.p2wpkh({ pubkey: childKey0FromXpub.derivePath(derivationPath).publicKey, network: network}).address
    return address
}

export default generateSegwitAddress