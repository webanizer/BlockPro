import { encrypt } from 'eciesjs'

/**
 * - PublicKey (in hex)
 * - Message
 * @param publicKey
 * @param message
 * @returns {*}
 */
const encryptStandardECIES = (publicKey,message) => {
   return encrypt(publicKey, message)
}
export default encryptStandardECIES


