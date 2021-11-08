import { createRequire } from "module";
const require = createRequire(import.meta.url);
const bitcoin = require('bitcoinjs-lib')
var conv = require('binstring');
import base58 from 'bs58'
import { VERSION, NETWORK_FEE, VALIDATOR_FEE, EMAIL_VERIFICATION_FEE, TRANSACTION_FEE } from './constants.js'
import broadcastTransaction from './broadcastTransaction.js'

export const sendToAddress = async (keypair, destAddress, changeAddress, amount, inputsSelected, nameId, nameValue, encryptedTemplateData, network) => {

    let opCodesStackScript = undefined

    //check if we want a nameId or nameValue transaction (create OpCodeStackScript)
    if (nameId && nameValue && typeof nameId === 'string' && typeof nameValue === 'string') {
        let nameIdPart2 = ''
        /* if (nameId.length > 57) //we have only space for 77 chars in the name in case its longer as in signatures put the rest into the value
         {
             nameIdPart2 = nameId.substring(57, nameId.length)
             nameId = nameId.substring(0, 57)
             nameValue = nameIdPart2 + ' ' + nameValue
         }*/
       
       
        const op_name = conv(nameId, { in: 'binary', out: 'hex' })
        let op_value = conv(nameValue, { in: 'binary', out: 'hex' })
        if (destAddress !== undefined) {
            const op_address = base58.decode(destAddress).toString('hex').substr(2, 40);
            opCodesStackScript = bitcoin.script.fromASM(
                `
                                                  OP_10
                                                  ${op_name}
                                                  ${op_value}
                                                  OP_2DROP
                                                  OP_DROP
                                                  OP_DUP
                                                  OP_HASH160
                                                  ${op_address}
                                                  OP_EQUALVERIFY
                                                  OP_CHECKSIG
                                            `.trim().replace(/\s+/g, ' '),
            )
        }

        opCodesStackScript = bitcoin.script.fromASM(
            `
                                              OP_10
                                              ${op_name}
                                              ${op_value}
                                              OP_2DROP
                                              OP_DROP
                                              OP_DUP
                                              OP_HASH160
                                              OP_EQUALVERIFY
                                              OP_CHECKSIG
                                        `.trim().replace(/\s+/g, ' '),
        )
    }  //if no nameId it could be nameId is a network object
    if (nameId instanceof Object) network = nameId
    if (!network) network = global.DEFAULT_NETWORK

    if (inputsSelected === undefined) { //TODO get required inputs from current available transactions (confirmed / unconfirmed)
    }

    let inputs = []

    for (let i = 0; i < inputsSelected.length; i++){
        inputs.push(inputsSelected[i].UTXOs)
    }

    const txb = new bitcoin.TransactionBuilder(network)

    let inputsBalance = 0

    const psbt = new bitcoin.Psbt();
    psbt.setVersion(2); // These are defaults. This line is not needed.
    psbt.setLocktime(0); // These are defaults. This line is not needed.
    
    if (inputs) {
    for (let i = 0; i < inputs.length; i++){   
        let input = inputs[i]
        for (let j = 0; j < input.length; ++j){
            inputsBalance = input[j].value + inputsBalance 
            txb.addInput(input[j].tx_hash, input[j].tx_pos)

            psbt.addInput({
                // if hash is string, txid, if hash is Buffer, is reversed compared to txid
                hash: input[j].tx_hash,
                index: input[j].tx_pos,
                sequence: 0xffffffff, // These are defaults. This line is not needed.
          
                // non-segwit inputs now require passing the whole previous tx as Buffer
                /*nonWitnessUtxo: Buffer.from(
                  '0200000001f9f34e95b9d5c8abcd20fc5bd4a825d1517be62f0f775e5f36da944d9' +
                    '452e550000000006b483045022100c86e9a111afc90f64b4904bd609e9eaed80d48' +
                    'ca17c162b1aca0a788ac3526f002207bb79b60d4fc6526329bf18a77135dc566020' +
                    '9e761da46e1c2f1152ec013215801210211755115eabf846720f5cb18f248666fec' +
                    '631e5e1e66009ce3710ceea5b1ad13ffffffff01' +
                    // value in satoshis (Int64LE) = 0x015f90 = 90000
                    '905f010000000000' +
                    // scriptPubkey length
                    '19' +
                    // scriptPubkey
                    '76a9148bbc95d2709c71607c60ee3f097c1217482f518d88ac' +
                    // locktime
                    '00000000',
                  'hex',
                ),*/
          
                // // If this input was segwit, instead of nonWitnessUtxo, you would add
                // // a witnessUtxo as follows. The scriptPubkey and the value only are needed.
                witnessUtxo: {
                    script: Buffer.from('0014' + alice[1].pubKeyHash, 'hex'),
                    value: 1e8, 
                },
          
                // Not featured here:
                //   redeemScript. A Buffer of the redeemScript for P2SH
                //   witnessScript. A Buffer of the witnessScript for P2WSH
              });

            console.log('added input ' + input[j].tx_hash)
        }
    }
    }
    const fee = 1000 //inputs.length * 180 + 3 * 34 + 500000
    console.log('fee', fee)

    // https://bitcoin.stackexchange.com/questions/1195/how-to-calculate-transaction-size-before-sending-legacy-non-segwit-p2pkh-p2sh
    const changeAmount = Math.round(inputsBalance - amount - fee - (opCodesStackScript ? NETWORK_FEE.satoshis : 0))
    if (destAddress !== undefined) {
        txb.addOutput(destAddress, amount)
    }
    txb.addOutput(changeAddress, changeAmount)

    console.log('added output ' + destAddress, amount)
    console.log('added changeAddress ' + changeAddress, changeAmount)

    psbt.addOutput({
      address: '1KRMKfeZcmosxALVYESdPNez1AP1mEtywp',
      value: 80000,
    });
    psbt.signInput(0, alice);
    psbt.validateSignaturesOfInput(0, validator);
    psbt.finalizeAllInputs();

    if (opCodesStackScript) {
        txb.setVersion(VERSION) //use this for name transactions
        txb.addOutput(opCodesStackScript, NETWORK_FEE.satoshis)
    }
    //console.log('unsignedTx',txb.build())
    if (!Array.isArray(keypair)) {
        console.log('keypair is not an array')
        txb.sign(0, keypair)
    }
    else {
        for (let i = 0; i < keypair.length; i++) {
            console.log('signing with keypair ' + i, keypair[i].privateKey)
            for (let j = 0; j < txb.__INPUTS.length; j++)
                txb.sign(j, keypair[i])
        }
    }
    console.log('signedTx', txb.build().toHex())
    try {
        const txSignedSerialized = txb.build().toHex()
        if (!encryptedTemplateData){
            var rawtx = await client.blockchain_transaction_broadcast(txSignedSerialized) 
            console.log("rawtx: ", rawtx)
            return rawtx
        }
        else
            return broadcastTransaction(nameId, txSignedSerialized, encryptedTemplateData, null, destAddress)
    } catch (e) {
        console.log('error broadcasting transaction', e)
    }
}

export default sendToAddress


