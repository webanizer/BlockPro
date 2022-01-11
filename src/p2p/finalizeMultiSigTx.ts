// @ts-expect-error ts-migrate(2305) FIXME: Module '"module"' has no exported member 'createRe... Remove this comment to see the full error message
import { createRequire } from "module"; // Bring in the ability to create the 'require' method
import { getKeyPair } from "./publish.js";
// @ts-expect-error ts-migrate(2441) FIXME: Duplicate identifier 'require'. Compiler reserves ... Remove this comment to see the full error message
const require = createRequire(import.meta.url); // construct the require method
let bitcoin = require('bitcoinjs-lib');
import { clearSignatures, receivedSignatures, s } from './sharedState.js';


export async function finalizeMultiSigTx(psbtBaseText: any) {

    // @ts-expect-error ts-migrate(2339) FIXME: Property 'network' does not exist on type '{}'.
    let opts = { network: s.network }

    // each signer imports
    const txToSign = bitcoin.Psbt.fromBase64(psbtBaseText, opts)
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'basePath' does not exist on type '{}'.
    let keyPair = getKeyPair(`${s.basePath}/0/1`)
    let signed1 = txToSign.signAllInputs(keyPair)

    // @ts-expect-error ts-migrate(2339) FIXME: Property 'm' does not exist on type '{}'.
    if (receivedSignatures.length < s.m && s.m !== 1) {
        // Throw Error not enough signatures        
        console.log("not enough signatures")
    }

    let accumulatedSigs = signed1
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'm' does not exist on type '{}'.
    if (s.m !== 1) {
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'm' does not exist on type '{}'.
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
    // var rawtx = await global.client.blockchain_transaction_broadcast(accumulatedSigs.extractTransaction().toHex()) 

    clearSignatures()
    return //rawtx
}


