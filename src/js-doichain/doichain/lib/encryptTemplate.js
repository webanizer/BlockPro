//import encryptMessage from './encryptMessage'
import getDataHash from "./getDataHash";
import encryptStandardECIES from "./encryptStandardECIES";

export const encryptTemplate = (validatorPublicKeyData, email, ourWallet) => {
    console.log('encrypting template with ',{validatorPublicKeyData:validatorPublicKeyData,
    email: email, ourWallet: ourWallet})
    const ourFrom = ourWallet.senderEmail

    const templateData = {
        "senderName": ourWallet.senderName ? ourWallet.senderName : '',
        "sender": ourFrom, //TODO the sender of this email shouldn't be necessary to transmit (we only need this for the Doichain footer to tell the recipient whom he grants the permission) Unfortunately, we don't want to trust either the transmitting node nor the sending validator to know such data
        "recipient": email,
        "content": ourWallet.content,
        "redirect": ourWallet.redirectUrl,
        "subject": ourWallet.subject,
        "contentType": (ourWallet.contentType || 'html'),
        "returnPath": ourWallet.returnPath
    }

    if (validatorPublicKeyData.type === 'default' || validatorPublicKeyData.type === 'delegated')  //we store a hash only(!) at the responsible validator - never on a fallback validator
        templateData.verifyLocalHash = getDataHash({data: (ourFrom + email)}); //verifyLocalHash = verifyLocalHash

    const our_encryptedTemplateData = encryptStandardECIES(
        //  keyPair._privateKey,
        validatorPublicKeyData.key.toString('hex'),
        JSON.stringify(templateData)).toString('hex')

    return our_encryptedTemplateData
}

export default encryptTemplate
