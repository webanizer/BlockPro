import { createRequire } from "module"; // Bring in the ability to create the 'require' method
const require = createRequire(import.meta.url); // construct the require method


export const createHdKeyFromMnemonic = (mnemonicSeedphrase, password) => {
    const bip39 = require("bip39")
    const HDKey = require("hdkey")
    const masterSeed = bip39
        .mnemonicToSeedSync(mnemonicSeedphrase, password ? password : "mnemonic")
        .toString("hex")
    return HDKey.fromMasterSeed(Buffer.from(masterSeed, "hex"), global.DEFAULT_NETWORK.bip32)
}
export default createHdKeyFromMnemonic
