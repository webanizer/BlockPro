// @ts-expect-error ts-migrate(2305) FIXME: Module '"module"' has no exported member 'createRe... Remove this comment to see the full error message
import { createRequire } from "module"; // Bring in the ability to create the 'require' method
// @ts-expect-error ts-migrate(2441) FIXME: Duplicate identifier 'require'. Compiler reserves ... Remove this comment to see the full error message
const require = createRequire(import.meta.url); // construct the require method


export const createHdKeyFromMnemonic = (mnemonicSeedphrase: any, password: any) => {
    const bip39 = require("bip39")
    const HDKey = require("hdkey")
    const masterSeed = bip39
        .mnemonicToSeedSync(mnemonicSeedphrase, password ? password : "mnemonic")
        .toString("hex")
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'DEFAULT_NETWORK' does not exist on type ... Remove this comment to see the full error message
    return HDKey.fromMasterSeed(Buffer.from(masterSeed, "hex"), global.DEFAULT_NETWORK.bip32)
}
export default createHdKeyFromMnemonic
