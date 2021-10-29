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

         const psbt = new bitcoin.Psbt({network})
         .addInput({
           hash: 'TX_ID',
           index: TX_VOUT,
           witnessUtxo: {
             script: Buffer.from('0014' + alice[1].pubKeyHash, 'hex'),
             value: 1e8, 
           },
         })
         .addOutput({
           address: bob[1].p2wpkh,
           value: 5e7,
         }) 
        .addOutput({
           address: alice[1].p2wpkh,
           value: 499e5,
         }) 
       
       
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
    if (inputs) {
    for (let i = 0; i < inputs.length; i++){   
        let input = inputs[i]
        for (let j = 0; j < input.length; ++j){
            inputsBalance = input[j].value + inputsBalance 
            txb.addInput(input[j].tx_hash, input[j].tx_pos)

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


