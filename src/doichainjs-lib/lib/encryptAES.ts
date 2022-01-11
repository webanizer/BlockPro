// @ts-expect-error ts-migrate(2305) FIXME: Module '"module"' has no exported member 'createRe... Remove this comment to see the full error message
import { createRequire } from "module"; // Bring in the ability to create the 'require' method
// @ts-expect-error ts-migrate(2441) FIXME: Duplicate identifier 'require'. Compiler reserves ... Remove this comment to see the full error message
const require = createRequire(import.meta.url); // construct the require method
const CryptoJS = require("crypto-js");

export const encryptAES = (seedPhrase: any, password: any) => {
  const encrypted = CryptoJS.AES.encrypt(seedPhrase, password);
  return encrypted.toString();
};
