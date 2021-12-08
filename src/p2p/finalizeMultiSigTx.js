import uint8ArrayToString from 'uint8arrays/to-string.js'
import { createRequire } from "module"; // Bring in the ability to create the 'require' method
const require = createRequire(import.meta.url); // construct the require method
import { multiSigTx } from '../doichainjs-lib/lib/createMultiSig.js';
const ElectrumClient = require("@codewarriorr/electrum-client-js")
let bitcoin = require('bitcoinjs-lib');


export async function finalizeMultiSigTx(receivedSignatures, psbtBaseText, purpose, coinType, m) {

    let opts = { network: global.DEFAULT_NETWORK }
    const psbt = new bitcoin.Psbt({ network: global.DEFAULT_NETWORK })
    // each signer imports
    const txToSign = bitcoin.Psbt.fromBase64(psbtBaseText, opts)
    let newDerivationPath = `${purpose}/${coinType}/0/0/1`
    let keyPair = global.hdkey.derive(newDerivationPath)
    let signed1 = txToSign.signAllInputs(keyPair)

    if (receivedSignatures.length < m) {
        // Throw Error not enough signatures        
        console.log("not enough signatures")
    }

    let accumulatedSigs = signed1
    if (m !== 1) {
        for (let i = 0; i < m; i++) {
            accumulatedSigs = accumulatedSigs.combine(receivedSignatures[i])
        }
    }

    // Finalizer wants to check all signatures are valid before finalizing.
    // If the finalizer wants to check for specific pubkeys, the second arg
    // can be passed. See the first multisig example below.
    // psbt.validateSignaturesOfInput(0, validator)
    // psbt.validateSignaturesOfInput(1, validator)

    accumulatedSigs.finalizeAllInputs();
    console.log(accumulatedSigs.extractTransaction().toHex())
    var rawtx = await global.client.blockchain_transaction_broadcast(Psbt.extractTransaction().toHex()) 

    receivedSignatures = []

}


