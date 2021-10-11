
export const validateMnemonic = (mnemonicSeedphrase, password) => {
    const bip39 = require("bip39")
    return bip39.validateMnemonic(mnemonicSeedphrase, password)
}
