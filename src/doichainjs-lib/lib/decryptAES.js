import { createRequire } from "module"; // Bring in the ability to create the 'require' method
const require = createRequire(import.meta.url); // construct the require method
const CryptoJS = require("crypto-js");

export const decryptAES = (encryptedSeedPhrase, password) => {
  const our_password = password ? password : "mnemonic"
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedSeedPhrase, our_password)
    
    return decrypted.toString(CryptoJS.enc.Utf8)
  } catch(err) {
    return ""
  }
};
