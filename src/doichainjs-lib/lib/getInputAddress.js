import { createRequire } from "module"; 
const require = createRequire(import.meta.url); 
import { getElectrumClient } from "./network.js";
const bitcoin = require("bitcoinjs-lib")

const getInputAddressFromWitness = (input) => {
  if (input.witness !== undefined) {
    let witness = input.witness;
    let obj = bitcoin.payments.p2wpkh({ witness })    
    return obj.address;
  }
  return false
}

export const getInputAddress = async (address, o_options) => { 
  let options = {}
  if(o_options===undefined || o_options.network===undefined)
      options.network=bitcoin.networks.bitcoin
  else options.network = o_options.network
  const script = bitcoin.address.toOutputScript(address,options.network);
  const hash = bitcoin.crypto.sha256(script);
  let reversedHash = new Buffer.from(hash.reverse());
  console.log(address, " maps to ", reversedHash.toString("hex"))
 
  const client = getElectrumClient()
  const inputAddress = [];

  try {
    await client.connect(
      "electrum-client-js", // optional client name
      "1.4.2" // optional protocol version
    );

    const history = await client.blockchain_scripthash_getHistory(
      reversedHash.toString("hex")
    );

    for (const tx of history) {
      const transaction = await client.blockchain_transaction_get(tx.tx_hash);
      const decryptedTx = bitcoin.Transaction.fromHex(transaction);

      for (const input of decryptedTx.ins) {
        inputAddress.push(await getInputAddressFromWitness(input));
      }
    }
    //console.log("inputAddress", inputAddress);
    client.close();
  } catch (err) {
    console.error(err);
  }

  return inputAddress;
};
export default getInputAddress
