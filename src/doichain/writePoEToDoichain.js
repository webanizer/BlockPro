import { nameDoi } from "./rpcCalls.js"
import checkBalance from "./checkBalance.js"
import createAndSendTransaction from "../doichainjs-lib/lib/createAndSendTransaction.js";

/**
 * 1. Craete Doichain transaction name_doi
 * 2. Sign transaction with PrivateKey
 * 3. Broadcast transactaction to Doichain Core 
 * 
 * @param {*} cid 
 * @param {*} hash 
 */
const writePoEToDoichain = async (cid, hash) => {

        console.log("CID in die Doichainspeichern: " + cid);  
        console.log("Hash in die doichain speichern: " + hash)
        let nameId = cid
        let nameValue = hash
        
        // Check if there are still enough Doi in the wallet for the name tx
        await checkBalance(global.url);
        const txResponse = await createAndSendTransaction(decryptedSeedPhrase,
                password,
                sendSchwartz,
                destAddress,
                our_wallet,
                nameId,
                nameValue,
                encryptedTemplateData)
        console.log("txResponse", txResponse)
        //const nameDoiTx = await nameDoi(url, hash, cid,false);

        console.log("Ende von Poe")

}
export default writePoEToDoichain


