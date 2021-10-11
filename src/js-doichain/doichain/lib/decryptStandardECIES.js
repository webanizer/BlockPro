import { decrypt } from 'eciesjs'

/**
 *
 *
 * @param privateKey (in hex)
 * @param message
 * @returns {undefined|*}
 */
const decryptStandardECIES = (privateKey,message) => {
    return decrypt(privateKey, Buffer.from(message,"hex")).toString()
}
export default decryptStandardECIES
