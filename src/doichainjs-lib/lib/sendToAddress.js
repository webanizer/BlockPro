import { createRequire } from "module";
const require = createRequire(import.meta.url);
const bitcoin = require('bitcoinjs-lib')
var conv = require('binstring');
import base58 from 'bs58'
import { VERSION, NETWORK_FEE, VALIDATOR_FEE, EMAIL_VERIFICATION_FEE, TRANSACTION_FEE } from './constants.js'
import broadcastTransaction from './broadcastTransaction.js'
import { join } from "path";

export const sendToAddress = async (keypair, destAddress, changeAddress, amount, inputsSelected, nameId, nameValue, network) => {

    let nameFee = 1000000
    let opCodesStackScript = undefined

    //check if we want a nameId or nameValue transaction (create OpCodeStackScript)
    if (nameId && nameValue && typeof nameId === 'string' && typeof nameValue === 'string') {

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
    }

    //if no nameId it could be nameId is a network object
    if (nameId instanceof Object) network = nameId
    if (!network) network = global.DEFAULT_NETWORK

    if (inputsSelected === undefined) { //TODO get required inputs from current available transactions (confirmed / unconfirmed)
    }

    let inputs = []

    for (let i = 0; i < inputsSelected.length; i++) {
        inputs.push(inputsSelected[i].UTXOs)
    }

    let inputsBalance = 0

    const psbt = new bitcoin.Psbt({ network: network });
    psbt.setVersion(2); // These are defaults. This line is not needed.
    psbt.setLocktime(0); // These are defaults. This line is not needed.

    if (inputs) {
        for (let i = 0; i < inputs.length; i++) {
            let input = inputs[i]
            for (let j = 0; j < input.length; ++j) {
                inputsBalance = input[j].value + inputsBalance
                let returndTx = await client.blockchain_transaction_get(input[j].tx_hash, 1)
                let scriptPubKey = returndTx.vout[input[j].tx_pos].scriptPubKey.hex
                let inputAddr = returndTx.vout[input[j].tx_pos].scriptPubKey.addresses[0]
                let addrIsSegwit = inputAddr.startsWith("td1") || inputAddr.startsWith("dc")

                // if legacy address
                if (!addrIsSegwit) {
                    psbt.addInput({
                        // if hash is string, txid, if hash is Buffer, is reversed compared to txid
                        hash: input[j].tx_hash,
                        index: input[j].tx_pos,
                        sequence: 0xffffffff, // These are defaults. This line is not needed.

                        // non-segwit inputs now require passing the whole previous tx as Buffer
                        nonWitnessUtxo: Buffer.from(
                            returndTx.hex,
                            'hex'
                        )
                    });
                } else {
                    psbt.addInput({
                        // if hash is string, txid, if hash is Buffer, is reversed compared to txid
                        hash: input[j].tx_hash,
                        index: input[j].tx_pos,
                        sequence: 0xffffffff, // These are defaults. This line is not needed.

                        // // If this input was segwit, instead of nonWitnessUtxo, you would add
                        // // a witnessUtxo as follows. The scriptPubkey and the value only are needed.          
                        witnessUtxo: {
                            script: Buffer.from(scriptPubKey, 'hex'),
                            value: input[j].value,
                        },

                        // Not featured here:
                        //   redeemScript. A Buffer of the redeemScript for P2SH
                        //   witnessScript. A Buffer of the witnessScript for P2WSH
                    });
                }

                console.log('added input ' + input[j].tx_hash)
            }
        }
    }
    const fee = 44800 //inputs.length * 180 + 3 * 34 + 500000
    console.log('fee', fee)

    if (amount == undefined)
        amount = 0

    // https://bitcoin.stackexchange.com/questions/1195/how-to-calculate-transaction-size-before-sending-legacy-non-segwit-p2pkh-p2sh
    const changeAmount = Math.round(inputsBalance - amount - fee - (opCodesStackScript ? nameFee : 0))
    if (destAddress !== undefined) {
        psbt.addOutput({
            address: destAddress,
            value: amount,
        });
    }

    console.log('added output ' + destAddress, amount)
    console.log('added changeAddress ' + changeAddress, changeAmount)

    psbt.addOutput({
        address: changeAddress,
        value: changeAmount,
    });

    if (opCodesStackScript) {
        psbt.version =  0x7100
        let script = opCodesStackScript     
        psbt.addOutput({
            script: script,
            value: nameFee})
    }

    if (inputs.length == 1) {
        psbt.signInput(0, keypair[0])
    } else {
        for (let i = 0; i < keypair.length; i++) {
            psbt.signAllInputs(keypair[i]);
        }
    }

    for (let i = 0; i < inputs.length; i++) {
        psbt.validateSignaturesOfInput(i, keypair[i].publicKey);
    }
    psbt.finalizeAllInputs();

    console.log('Transaction hexadecimal:')
    console.log(psbt.extractTransaction().toHex())


    try {
        var rawtx = await client.blockchain_transaction_broadcast(psbt.extractTransaction().toHex())
        console.log("rawtx: ", rawtx)
        return rawtx
    } catch (e) {
        console.log('error broadcasting transaction', e)
    }
}

export default sendToAddress


