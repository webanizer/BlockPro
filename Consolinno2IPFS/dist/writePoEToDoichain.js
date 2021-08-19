import { nameDoi } from "./rpcCalls.js";
import checkBalance from "./checkBalance.js";
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
    console.log("Hash in die doichain speichern: " + hash);
    // Check if there are still enough Doi in the wallet for the name tx
    await checkBalance(global.url);
    const nameDoiTx = await nameDoi(url, hash, cid.toString(), false);
    console.log("Ende von Poe");
};
export default writePoEToDoichain;
