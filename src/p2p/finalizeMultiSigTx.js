import { createRequire } from "module"; // Bring in the ability to create the 'require' method
import { getKeyPair } from "./publish.js";
const require = createRequire(import.meta.url); // construct the require method
let bitcoin = require('bitcoinjs-lib');
import { clearSignatures, receivedSignatures, s } from './sharedState.js';


export async function finalizeMultiSigTx(psbtBaseText) {

    let opts = { network: s.network }

    // each signer imports
    const txToSign = bitcoin.Psbt.fromBase64(psbtBaseText, opts)

    let signed1

    if (s.ersteRunde) {
        s.ersteRunde = false
        let keyPair = getKeyPair(`${s.basePath}/0/1`)
        if (txToSign.data.inputs.length == 1) {
            signed1 = txToSign.signInput(0, keyPair)
        } else {
            signed1 = txToSign.signAllInputs(keyPair);
        }
    } else {
        let nextDerPath = s.lastDerPath.split("/")[1]
        if (s.ohnePeersLetzteRunde){
            nextDerPath = --nextDerPath 
        }
        
        // Must sign with lastDerPath from last rounds MultiSigAddress
        let lastDerPath = `${s.lastDerPath.split("/")[0]}/${--nextDerPath}`
        console.log("Trying to sign with derPath: " + lastDerPath)
        let keyPair = getKeyPair(`${s.basePath}/${lastDerPath}`)

        if (txToSign.data.inputs.length == 1) {
            signed1 = txToSign.signInput(0, keyPair)
        } else {
            signed1 = txToSign.signAllInputs(keyPair);
        }

    }


    if (receivedSignatures.length < s.mOld && s.mOld !== 1) {
        // Throw Error not enough signatures        
        console.log("not enough signatures")
    }

    let accumulatedSigs = signed1
    if (s.mOld !== 1 && receivedSignatures.length !==0 ) {
        for (let i = 0; i < --s.mOld; i++) {
            accumulatedSigs = accumulatedSigs.combine(receivedSignatures[i])
        }
    }

    // Finalizer wants to check all signatures are valid before finalizing.
    // If the finalizer wants to check for specific pubkeys, the second arg
    // can be passed. See the first multisig example below.
    // psbt.validateSignaturesOfInput(0, validator)
    // psbt.validateSignaturesOfInput(1, validator)

    accumulatedSigs.finalizeAllInputs();
    let vsize = accumulatedSigs.extractTransaction().virtualSize()
    console.log("vsize = ", vsize)
    console.log(accumulatedSigs.extractTransaction().toHex())
    var rawtx = await global.client.blockchain_transaction_broadcast(accumulatedSigs.extractTransaction().toHex())
    return rawtx
}


