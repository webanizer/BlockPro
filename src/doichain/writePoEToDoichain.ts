import { nameDoi } from "./rpcCalls.js"
import checkBalance from "./checkBalance.js"
import { s } from "../p2p/sharedState.js";
import createAndSendTransaction from "../doichainjs-lib/lib/createAndSendTransaction.js";

/**
 * 1. Craete Doichain transaction name_doi
 * 2. Sign transaction with PrivateKey
 * 3. Broadcast transactaction to Doichain Core 
 * 
 * @param {*} cid 
 * @param {*} hash 
 */
const writePoEToDoichain = async (cid: any, hash: any) => {

        console.log("CID in die Doichainspeichern: " + cid);  
        console.log("Hash in die doichain speichern: " + hash)
        let nameId = cid
        let nameValue = hash
        let amount
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'seed' does not exist on type '{}'.
        let decryptedSeedPhrase = s.seed
        let sendSchwartz
        let destAddress
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'wallet' does not exist on type '{}'.
        let our_wallet = s.wallet
        
        // Check if there are still enough Doi in the wallet for the name tx
        //await checkBalance(global.url);
        const txResponse = await createAndSendTransaction(decryptedSeedPhrase,
                // @ts-expect-error ts-migrate(2339) FIXME: Property 'password' does not exist on type '{}'.
                s.password,
                amount,
                destAddress,
                our_wallet,
                nameId,
                nameValue)
        console.log("txResponse", txResponse)
        //const nameDoiTx = await nameDoi(url, hash, cid,false);

        console.log("Ende von Poe")

}
export default writePoEToDoichain


