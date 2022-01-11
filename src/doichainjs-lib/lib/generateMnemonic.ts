// @ts-expect-error ts-migrate(2305) FIXME: Module '"module"' has no exported member 'createRe... Remove this comment to see the full error message
import { createRequire } from "module"; 
// @ts-expect-error ts-migrate(2441) FIXME: Duplicate identifier 'require'. Compiler reserves ... Remove this comment to see the full error message
const require = createRequire(import.meta.url); 

export const generateMnemonic = () => {
    const bip39 = require("bip39")
    const mnemonic = bip39.generateMnemonic()
    return mnemonic
}
