import uint8ArrayToString from 'uint8arrays/to-string.js'
import { createRequire } from "module"; // Bring in the ability to create the 'require' method
const require = createRequire(import.meta.url); // construct the require method
import { multiSigTx } from '../doichainjs-lib/lib/createMultiSig.js';
const ElectrumClient = require("@codewarriorr/electrum-client-js")
let bitcoin = require('bitcoinjs-lib');


export async function finalizeMultiSigTx(receivedSignatures, psbt, purpose, coinType, m) {

    const psbtBaseText = psbt.toBase64();

    // each signer imports
    const txToSign = bitcoin.Psbt.fromBase64(psbtBaseText);

    let newDerivationPath = `${purpose}/${coinType}/0/0/1`
    let keyPair = global.hdkey.derive(newDerivationPath)

    // signs each input with the respective private keys
    // signInput and signInputAsync are better
    // (They take the input index explicitly as the first arg)
    txToSign.signAllInputs(keyPair);

    receivedSignatures.push(txToSign)

    psbt.combine(final1, final2);
    let receivedSignatures = []

}
