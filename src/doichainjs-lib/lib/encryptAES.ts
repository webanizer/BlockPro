import { createRequire } from "module"; // Bring in the ability to create the 'require' method
const require = createRequire(import.meta.url); // construct the require method
const CryptoJS = require("crypto-js");

export const encryptAES = (seedPhrase, password) => {
  const encrypted = CryptoJS.AES.encrypt(seedPhrase, password);
  return encrypted.toString();
};
