import { createRequire } from "module";
const require = createRequire(import.meta.url);
const bitcoin = require('bitcoinjs-lib')
const ElectrumClient = require('@codewarriorr/electrum-client-js')
import { isOurAddress } from "./isOurAddress.js";
import { isOurChangeAddress } from "./isOurChangeAddress.js";
import { getAddressOfInput } from "./getAddressOfInput.js"

function hex2a(hexx) {
    var hex = hexx.toString();//force conversion
    var str = '';
    for (var i = 0; (i < hex.length && hex.substr(i, 2) !== '00'); i += 2)
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    return str;
}

var scriptStrBuf = function (data) {
    var stringLength = data.length / 2;
    var len;
    var opcode;
    var bw = new BufferWriter();
    if (data.length <= 252) {
        bw.writeUInt8(stringLength);
        opcode = stringLength;
    } else if (stringLength <= 252) {
        bw.writeUInt8(stringLength);
        opcode = Opcode.OP_PUSHDATA1;
    } else if (stringLength <= 0xffff) {
        bw.writeUInt16LE(data.length);
        opcode = Opcode.OP_PUSHDATA2;
    } else {
        bw.writeUInt32LE(data.length);
        opcode = Opcode.OP_PUSHDATA4;
    }
    len = bufferTools.bufferToHex(bw.bufs[0]);
    var chunk = {
        buf: Buffer.from(data, 'hex'),
        len: stringLength,
        opcodenum: opcode
    };
    return chunk;
}

export async function listTransactions(address, o_options, addressList, client) {
    let options = {}
    if (o_options === undefined || o_options.network === undefined)
        options = global.DEFAULT_NETWORK
    else options = o_options
    global.network = options.network
    console.info('listing transactions for address address', address)

    //if this is a p2pkh
    let script = bitcoin.address.toOutputScript(address, network)

    let hash = bitcoin.crypto.sha256(script)
    let reversedHash = Buffer.from(hash.reverse())
    console.log(address, ' maps to ', reversedHash.toString('hex'))

    //const client = new ElectrumClient("172.22.0.6", 50002, "ssl");
    const result = [];

    try {
        const header = await client.blockchain_headers_subscribe()
        const history = await client.blockchain_scripthash_getHistory(
            reversedHash.toString("hex")
        )
        const UTXO = await client.blockchain_scripthash_listunspent(
            reversedHash.toString("hex")
        )


        let i = 0
        for (const tx of UTXO) {
            const transaction = tx
            const decryptedTx = await client.blockchain_transaction_get(transaction.tx_hash, 1)
            console.log("decrypted tx with index", i)

            //check all inputs and check if the address is ours or not
            let isOurInput = false
            /*decryptedTx.vin.forEach(async function(input, n) {
                const inputAddress = getAddressOfInput(input)
                if (isOurAddress(inputAddress)) isOurInput = true
            })*/

            const decriptedHeader = bitcoin.Block.fromHex(header.hex)

            decryptedTx.vout.forEach(async (out, n) => {

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
                    for (let i = 0; i < addressList.length; i++) {
                        if (address == addressList[i]) {
                            utxo = true
                            break
                        }
                    }
                } else {
                    const chunks = bitcoin.script.decompile(out.script)
                    nameId = Buffer.from(chunks[1]).toString()
                    nameValue = Buffer.from(chunks[2]).toString()
                    address = bitcoin.address.toBase58Check(chunks[7], network.scriptHash)
                }
                console.log('name_op nameId', nameId)
                console.log('name_op nameValue', nameValue)
                console.log('name_op address', address)



                vout = {
                    txid: decryptedTx.txid,
                    satoshi: isOurInput ? 1e-8 * out.value : 100000000 * out.value,
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
        console.info('history length', result.length)
        const balance = await client.blockchain_scripthash_getBalance(
            reversedHash.toString("hex")
        );
        console.log("Balance: ", balance);
        const UTXOs = await client.blockchain_scripthash_listunspent(
            reversedHash.toString("hex")
        );
        //console.log("Unspents: ", UTXOs);

    } catch (err) {
        console.error(err);
    }

    return result;
}