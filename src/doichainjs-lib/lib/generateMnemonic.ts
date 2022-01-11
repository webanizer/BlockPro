import { createRequire } from "module"; 
const require = createRequire(import.meta.url); 

export const generateMnemonic = () => {
    const bip39 = require("bip39")
    const mnemonic = bip39.generateMnemonic()
    return mnemonic
}
