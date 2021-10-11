var { randomBytes } = require('crypto')
const bitcoinMessage = require('bitcoinjs-message')
/**
 * Create Signature via bitcoin-js message
 * - https://medium.com/coinmonks/how-to-sign-verify-messages-with-bitcoin-flo-keys-64e6150a5879
 * - https://github.com/bitcoinjs/bitcoinjs-message
 * @param message
 * @param privateKey
 * @returns {*}
 */
const getSignature = (message,keyPair) => {
    try {
     //   const privateKey = keyPair.d.toBuffer(32)
        //var message = 'Hey this is Ranchi Mall'
        console.log('creating signature for message: '+message+' with privateKey:',keyPair.privateKey.toString('hex'))
        console.log('publicKey:',keyPair.publicKey.toString('hex'))
        const signature = bitcoinMessage.sign(message,keyPair.privateKey, keyPair.compressed) //, { extraEntropy: randomBytes(32) }
        console.log("signature",signature)
        return signature.toString('base64')
    } catch(exception) {
        throw {error:"Error during creating signature for doichain entry", exception: exception};
    }
};

export default getSignature;
