import generateNameId from "./generateNameId";
import getSignature from "./getSignature";
import getDataHash from "./getDataHash";
//import getPublicKey from "./getPublicKey"
//import encryptMessage from "./encryptMessage"
import getUrl from "./getUrl";
import encryptStandardECIES from "./encryptStandardECIES";
import verifySignature from "./verifySignature";
const bitcoin = require('bitcoinjs-lib')
/**
 * 1. Calculate NameId
 * 2. Create NameValue (SOI-signature)
 *
 * @param getPrivatKey
 * @param from
 * @param to
 * @param data
 */
const createDoichainEntry = (keyPair, validatorPublicKey, from, to, data) => {
    const nameId =  generateNameId();
    const message = to+from;  //TODO why to+from and not from+to?
    const signature = getSignature(message, keyPair);

    console.log('keyPair.publicKey',keyPair.publicKey.toString('hex'))
    const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey, network: global.DEFAULT_NETWORK })
    console.log('address',address)
    const validSignature = verifySignature(message,address,signature)
    console.log('validSignature',validSignature)
    //chai.assert.equal(true, validSignature, "signature not valid")

    let dataHash = "";
    if(data) dataHash = getDataHash(data);

    const fromHostUrl = getUrl()
   // const fromHostUrlEncrypted = encryptMessage(keyPair._privateKey,validatorPublicKey,fromHostUrl)
    const fromHostUrlEncrypted = encryptStandardECIES(validatorPublicKey,fromHostUrl).toString('hex')
    const nameValue = JSON.stringify({
        signature: signature,
        dataHash: dataHash,
        from: fromHostUrlEncrypted
    });
    return {nameId:nameId,nameValue:nameValue}
}

export default createDoichainEntry
