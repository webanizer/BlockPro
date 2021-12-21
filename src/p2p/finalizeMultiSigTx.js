import { createRequire } from "module"; // Bring in the ability to create the 'require' method
const require = createRequire(import.meta.url); // construct the require method
let bitcoin = require('bitcoinjs-lib');
import { clearSignatures, receivedSignatures, s } from './sharedState.js';


export async function finalizeMultiSigTx(psbtBaseText) {

    let opts = { network: s.network }

    // each signer imports
    const txToSign = bitcoin.Psbt.fromBase64(psbtBaseText, opts)
    let newDerivationPath = `${s.purpose}/${s.coinType}/0/0/1`
    let keyPair = s.hdkey.derive(newDerivationPath)
    let signed1 = txToSign.signAllInputs(keyPair)

    if (receivedSignatures.length < s.m && s.m !== 1) {
        // Throw Error not enough signatures        
        console.log("not enough signatures")
    }

    let accumulatedSigs = signed1
    if (s.m !== 1) {
        for (let i = 0; i < s.m; i++) {
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
    //var rawtx = await global.client.blockchain_transaction_broadcast(accumulatedSigs.extractTransaction().toHex()) 

    clearSignatures()
    return //rawtx
}


