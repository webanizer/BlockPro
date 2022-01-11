// @ts-expect-error ts-migrate(2305) FIXME: Module '"module"' has no exported member 'createRe... Remove this comment to see the full error message
import { createRequire } from "module"; 
// @ts-expect-error ts-migrate(2441) FIXME: Duplicate identifier 'require'. Compiler reserves ... Remove this comment to see the full error message
const require = createRequire(import.meta.url); 
import { getElectrumClient } from "./network.js";
const bitcoin = require("bitcoinjs-lib")

const getInputAddressFromWitness = (input: any) => {
  if (input.witness !== undefined) {
    let witness = input.witness;
    let obj = bitcoin.payments.p2wpkh({ witness })    
    return obj.address;
  }
  return false
}

export const getInputAddress = async (address: any, o_options: any) => { 
  let options = {}
  if(o_options===undefined || o_options.network===undefined)
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'network' does not exist on type '{}'.
      options.network=bitcoin.networks.bitcoin
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'network' does not exist on type '{}'.
  else options.network = o_options.network
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'network' does not exist on type '{}'.
  const script = bitcoin.address.toOutputScript(address,options.network);
  const hash = bitcoin.crypto.sha256(script);
  // @ts-expect-error ts-migrate(7009) FIXME: 'new' expression, whose target lacks a construct s... Remove this comment to see the full error message
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
