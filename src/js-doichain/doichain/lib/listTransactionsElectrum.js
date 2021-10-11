const bitcoin = require('bitcoinjs-lib')
const ElectrumClient = require('@codewarriorr/electrum-client-js')
import {getElectrumClient} from "./network"
import settings from "./settings"
import {isOurAddress} from "./isOurAddress";
import {isOurChangeAddress} from "./isOurChangeAddress";
import { DOICHAIN,DEFAULT_NETWORK } from './network';
/**
 * TODO Please consolidate this Method with listTransactions which supports name_doi transactions 
 * but this one supports bech32 addresses!
 * 
 * @param {*} address 
 * @param {*} network 
 */
export async function listTransactionsElectrum(address, o_options) {

  let options = {}
  if(o_options===undefined || o_options.network===undefined)
      options.network=DOICHAIN
  else options.network = o_options.network

  if(o_options===undefined || o_options.settings===undefined)
      options.settings=settings
  else options.settings = o_options.settings
    
    let script = bitcoin.address.toOutputScript(address, options.network)
    let hash = bitcoin.crypto.sha256(script)  
    let reversedHash = Buffer.from(hash.reverse())

    const client = getElectrumClient(options.settings)
    let result = [];
      try {

        await client.connect(
          "electrum-client-js", // optional client name
          "1.4.2" // optional protocol version
        );

        const history = await client.blockchain_scripthash_getHistory(
          reversedHash.toString("hex")
        );

        function format_time(s) {
          const dtFormat = new Intl.DateTimeFormat('ru', {
            timeStyle: "medium",
            dateStyle: "short",
            // timeZone: 'UTC'
          });
          
          return dtFormat.format(new Date(s * 1e3));
        }

        let i = 0
        for (const tx of history){

          const transaction = await client.blockchain_transaction_get(
            tx.tx_hash
          )

          const decryptedTx = bitcoin.Transaction.fromHex(transaction);
          //check all inputs and check if the address is ours or not
          let isOurInput
          decryptedTx.ins.forEach(async function (input, n) {
            //find the address of the input tx
            if(!input.witness || input.witness.length===0){ //Doichain as the attribute wittness with an empty array
              const chunks = bitcoin.script.decompile(Buffer.from(input.script, "hex"))
              const dec = bitcoin.script.toASM(chunks).split(" ")[1];
              const address = bitcoin.payments.p2pkh({pubkey: Buffer.from(dec, "hex"),network: options.network,
              }).address;
              
              if(isOurAddress(address)) isOurInput=true
            }else{
              console.log(input.witness)
              let witness = [
                Buffer.from(input.witness[0], 'hex'),
                Buffer.from(input.witness[1], 'hex')
              ]
              let obj = bitcoin.payments.p2wpkh({ witness })
              console.info('is segwit bech32 address',obj.address)
              if(isOurAddress(obj.address)) isOurInput=true
            }
          });

          const header = await client.blockchain_headers_subscribe()
          const decriptedHeader = bitcoin.Block.fromHex(header.hex);

          decryptedTx.outs.forEach(function (out, n) {

            let address, nameId, nameValue
            let vout

            const asm = bitcoin.script.toASM(out.script)
            const asmParts = asm.split(" ")
            
            //in case this is a name_op (e.g. OP_10 transaction this script will not work - no chance getting the address 
            //we don't see any results printed even tho we expect received and sent transactions - what is the reason here
            if (asmParts[0] !== 'OP_10') {
                address = bitcoin.address.fromOutputScript(out.script, options.network)
                console.log('address', address)
            } else {
                const chunks = bitcoin.script.decompile(out.script)
                console.log(chunks)
                nameId = Buffer.from(chunks[1]).toString()
                //we had an int 0 here insead of a buffer
                if(chunks[2]!==0)
                  nameValue = Buffer.from(chunks[2]).toString()
                else nameValue = ""
                console.log(network)
                address = bitcoin.address.toBase58Check(chunks[7], options.network.scriptHash)
            }
            console.log('name_op nameId', nameId)
            console.log('name_op nameValue', nameValue)
            console.log('name_op address', address)

            vout = {
              txid: decryptedTx.getId(),
              satoshi: isOurInput ? out.value * -1 : out.value,
              value: isOurInput
                ? 1e-8 * out.value * -1
                : 1e-8 * out.value,
              n: n,
              category: isOurInput ? "sent" : "received",
              address: address,
              scriptPubKey: {
                asm: bitcoin.script.toASM(out.script),
                hex: out.script.toString("hex"),
              },
              timestamp:decriptedHeader.timestamp,
              createdAtTime: format_time(decriptedHeader.timestamp),
              timestamp: decriptedHeader.timestamp
            }

            if(nameId) vout.nameId = nameId
            if(nameValue) vout.nameValue = nameValue
                        // console.log(vout)
            if(isOurAddress(address) && !isOurChangeAddress(address)) result.push(vout)
          });
        }

     /*   const balance = await client.blockchain_scripthash_getBalance(
          reversedHash.toString("hex")
        );
        console.log(balance);
        const unspent = await client.blockchain_scripthash_listunspent(
          reversedHash.toString("hex")
        );
        console.log(unspent); */

       // await client.close();
      } catch (err) {
        console.error(err);
      }
      return result;
}