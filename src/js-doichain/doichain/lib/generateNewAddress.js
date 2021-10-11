const bitcoin = require('bitcoinjs-lib')

export const generateNewAddress = (publicExtendedKey, derivationPath, network) => {
    if(!network) network = global.DEFAULT_NETWORK
    let childKey0FromXpub = bitcoin.bip32.fromBase58(publicExtendedKey,network);
    const derivePathToArray = derivationPath.split('/')
    const newDerivationPath = derivePathToArray[0] + "/" + (derivePathToArray[1]+1)
   // console.log('newDerivationPath',newDerivationPath)
    let address = bitcoin.payments.p2pkh({ pubkey: childKey0FromXpub.derivePath(newDerivationPath).publicKey, network: network}).address
    return address
}
