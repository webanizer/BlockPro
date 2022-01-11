// @ts-expect-error ts-migrate(2305) FIXME: Module '"module"' has no exported member 'createRe... Remove this comment to see the full error message
import { createRequire } from "module"; 
// @ts-expect-error ts-migrate(2441) FIXME: Duplicate identifier 'require'. Compiler reserves ... Remove this comment to see the full error message
const require = createRequire(import.meta.url); 
const bitcoin = require('bitcoinjs-lib')
const ElectrumClient = require('@codewarriorr/electrum-client-js')
import {isOurAddress} from "./isOurAddress.js";
import {isOurChangeAddress} from "./isOurChangeAddress.js";
import {getAddressOfInput} from "./getAddressOfInput.js"

function hex2a(hexx: any) {
  var hex = hexx.toString();//force conversion
  var str = '';
  for (var i = 0; (i < hex.length && hex.substr(i, 2) !== '00'); i += 2)
      str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  return str;
}

var scriptStrBuf = function(data: any) {
    var stringLength = data.length / 2;
    var len;
    var opcode;
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'BufferWriter'.
    var bw = new BufferWriter();
    if (data.length <= 252) {
        bw.writeUInt8(stringLength);
        opcode = stringLength;
    } else if (stringLength <= 252) {
        bw.writeUInt8(stringLength);
        // @ts-expect-error ts-migrate(2552) FIXME: Cannot find name 'Opcode'. Did you mean 'opcode'?
        opcode = Opcode.OP_PUSHDATA1;
    } else if (stringLength <= 0xffff) {
        bw.writeUInt16LE(data.length);
        // @ts-expect-error ts-migrate(2552) FIXME: Cannot find name 'Opcode'. Did you mean 'opcode'?
        opcode = Opcode.OP_PUSHDATA2;
    } else {
        bw.writeUInt32LE(data.length);
        // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'Opcode'.
        opcode = Opcode.OP_PUSHDATA4;
    }
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'bufferTools'.
    len = bufferTools.bufferToHex(bw.bufs[0]);
    var chunk = {
        buf: Buffer.from(data, 'hex'),
        len: stringLength,
        opcodenum: opcode
    };
    return chunk;
}

export async function listTransactions(address: any, o_options: any, addressList: any) {
    let options = {}
    if(o_options===undefined || o_options.network===undefined)
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'DEFAULT_NETWORK' does not exist on type ... Remove this comment to see the full error message
        options=global.DEFAULT_NETWORK
    else options=o_options
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'network' does not exist on type 'Global'... Remove this comment to see the full error message
    global.network = options.network
    console.info('listing transactions for address address', address)

    //if this is a p2pkh
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'network'.
    let script = bitcoin.address.toOutputScript(address, network)  

    let hash = bitcoin.crypto.sha256(script)
    let reversedHash = Buffer.from(hash.reverse())
    console.log(address, ' maps to ', reversedHash.toString('hex'))

    // To Do: Auslagern und in stateObject packen
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'client' does not exist on type 'Global'.
    global.client = new ElectrumClient("spotty-goat-4.doi.works", 50002, "ssl");
    const result: any = [];

    try {
        // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'client'.
        await client.connect(
            "electrum-client-js", // optional client name
            "1.4.2" // optional protocol version
        )
        // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'client'.
        const header = await client.blockchain_headers_subscribe()
        // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'client'.
        const history = await client.blockchain_scripthash_getHistory(
            reversedHash.toString("hex")
        )
        // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'client'.
        const UTXO = await client.blockchain_scripthash_listunspent(
            reversedHash.toString("hex")
        )

        let i = 0
        for (const tx of UTXO) {
            const transaction = tx
            // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'client'.
            const decryptedTx = await client.blockchain_transaction_get(transaction.tx_hash, 1)
            console.log("decrypted tx with index", i)

            //check all inputs and check if the address is ours or not
            let isOurInput = false
            /*decryptedTx.vin.forEach(async function(input, n) {
                const inputAddress = getAddressOfInput(input)
                if (isOurAddress(inputAddress)) isOurInput = true
            })*/

            const decriptedHeader = bitcoin.Block.fromHex(header.hex)

            decryptedTx.vout.forEach(async (out: any, n: any) => {

                let address, nameId, nameValue
                let vout

                const asm = out.scriptPubKey.asm
                const asmParts = asm.split(" ")

                //in case this is a name_op (e.g. OP_10 transaction this script will not work - no chance getting the address 
                //we don't see any results printed even tho we expect received and sent transactions - what is the reason here
                
                let utxo = false
                
                if (asmParts[0] !== 'OP_10') {
                    address = out.scriptPubKey.addresses[0]
                    console.log('address', address)
                    for (let i = 0; i < addressList.length; i++){
                        if (address == addressList[i]){
                            utxo = true
                            break
                        }
                    }
                } else {
                    const chunks = bitcoin.script.decompile(out.script)
                    nameId = Buffer.from(chunks[1]).toString()
                    nameValue = Buffer.from(chunks[2]).toString()
                    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'network'.
                    address = bitcoin.address.toBase58Check(chunks[7], network.scriptHash)
                }
                console.log('name_op nameId', nameId)
                console.log('name_op nameValue', nameValue)
                console.log('name_op address', address)



                vout = {
                    txid: decryptedTx.txid,
                    satoshi: isOurInput ? 1e-8 * out.value  : 100000000* out.value,
                    value: isOurInput ? 1e-8 * out.value * -1 : out.value,
                    n: n,
                    category: isOurInput ? "sent" : "received",
                    address: address,
                    nameId: nameId,
                    nameValue: nameValue,
                    timestamp: decriptedHeader.timestamp
                }
                if (utxo) result.push(vout)
               // if(isOurAddress(address) && !isOurChangeAddress(address)) result.push(vout)
               // if (isOurAddress(address) && isOurInput) result.push(vout)
              //  if (isOurAddress(address) && !isOurInput) result.push(vout) //this is not our input, it's received
              //  if (!isOurAddress(address) && !isOurChangeAddress(address) && isOurInput) result.push(vout); // is our input, it's sent
            })
            i++
        }
        console.info('history length',result.length)
            // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'client'.
            const balance = await client.blockchain_scripthash_getBalance(
              reversedHash.toString("hex")
            );
            console.log("Balance: ", balance);
            // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'client'.
            const UTXOs = await client.blockchain_scripthash_listunspent(
              reversedHash.toString("hex")
            );
            console.log("Unspents: ", UTXOs);

        //await client.close();
    } catch (err) {
        console.error(err);
    }
    return result;
}