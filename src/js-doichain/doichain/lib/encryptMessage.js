/**
 * https://medium.com/@dealancer/how-to-using-bitcoin-key-pairs-to-for-encrypted-messaging-a0a980e627b1
 * https://stackoverflow.com/questions/36598638/generating-ecdh-keys-in-the-browser-through-webcryptoapi-instead-of-the-browseri
 * https://github.com/bitchan/eccrypto
 *
 * AES Encryption with a single shared key
 * https://www.npmjs.com/package/crypto-js
 */
import CryptoJS from 'crypto-js'
import crypto from "browser-crypto"

const encryptMessage = (privateKey,publicKey,message) => {
    var pubB = new Buffer(publicKey, 'hex');
    var ecdhA = crypto.createECDH('secp256k1');
    ecdhA.generateKeys('hex', 'compressed');
    ecdhA.setPrivateKey(privateKey, 'hex');
    var secret = ecdhA.computeSecret(pubB, 'hex').toString('hex')
    var ciphertext = CryptoJS.AES.encrypt(message, secret);
    return ciphertext.toString()
}

export default encryptMessage
