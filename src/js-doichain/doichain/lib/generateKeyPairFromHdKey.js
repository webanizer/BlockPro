const bitcoin = require('bitcoinjs-lib')

export const generateKeyPairFromHdKey = (hdKey, derivationPath) => {
    const keyPair = hdKey.derive(derivationPath)
    return keyPair
}

export default generateKeyPairFromHdKey
