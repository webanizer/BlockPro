// @ts-expect-error ts-migrate(2305) FIXME: Module '"module"' has no exported member 'createRe... Remove this comment to see the full error message
import { createRequire } from "module";
// @ts-expect-error ts-migrate(2441) FIXME: Duplicate identifier 'require'. Compiler reserves ... Remove this comment to see the full error message
const require = createRequire(import.meta.url);
const bitcoin = require('bitcoinjs-lib')
var conv = require('binstring')
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'bs58... Remove this comment to see the full error message
import base58 from 'bs58'
import { returnUnusedAddress } from "./getAddress.js"
import { ECPair } from 'ecpair';
import { publishMultiSigAddress } from "../../p2p/publish.js";
import { s } from "../../p2p/sharedState.js";


export const multiSigAddress = async (network: any, receivedPubKeys: any) => {
    // TO DO: Lösung für 1. Runde und nur 1 pubKey. Evtl. normale Tx nicht multi 
    let n = receivedPubKeys.length
    let m = Math.round(n * (2 / 3))
    var p2sh = createPayment(`p2sh-p2wsh-p2ms(${m} of ${n})`, receivedPubKeys, network);
    var multiSigAddress = p2sh.payment.address

    // To Do 

    console.log("Multisig address: ", multiSigAddress)

    // publish multisig address to peers
    return p2sh
}

var multisigBalance = 0

export const multiSigTx = async (network: any, addrType: any, purpose: any, coinType: any, account: any, id: any, p2sh: any, receivedPubKeys: any, hdkey: any, topic2: any, cid: any, hash: any) => {

    let nameFee = 1000000
    let destAddress = p2sh.payment.address
    let opCodesStackScript = undefined
    //check if we want a nameId or nameValue transaction (create OpCodeStackScript)
    if (cid && hash && typeof cid === 'string' && typeof hash === 'string') {

        const op_name = conv(cid, { in: 'binary', out: 'hex' })
        let op_value = conv(hash, { in: 'binary', out: 'hex' })
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
                                            `.trim().replace(/\s+/g, ' ')
        )
    }

    //if this is a p2pk
    let inputData = await getInputData(
        p2sh.payment,
        true,
        'p2sh-p2wsh',
        p2sh
    );

    let receiving = true
    let xpub = bitcoin.bip32.fromBase58(hdkey.publicExtendedKey, network)

    let myWinnerAddress = await returnUnusedAddress(network, addrType, purpose, coinType, account, receiving, id, xpub)
    myWinnerAddress = myWinnerAddress.address
    let reward = 1000000 //0.01 Doi
    let fee = 10000
    let change 
    // To Do: Check einbauen ob multisig ne balance hat
    if (opCodesStackScript){
        change = multisigBalance - reward - fee - nameFee
    }else{
        change = multisigBalance - reward - fee
    }

    // To Do: Wenn ohne Peers, dann keine neue Multisig generieren. Wechselgeld bleibt auf dem selben Wallet
    let nextP2sh = await multiSigAddress(network, receivedPubKeys)
    let nextMultiSigAddress = nextP2sh.payment.address

    // @ts-expect-error ts-migrate(2339) FIXME: Property 'DEFAULT_NETWORK' does not exist on type ... Remove this comment to see the full error message
    let psbt = new bitcoin.Psbt({ network: global.DEFAULT_NETWORK })
    for (var i = 0; i < inputData.length; i++) {
        psbt.addInput(inputData[i])
    }

    psbt.addOutput({
        address: myWinnerAddress,
        value: reward,
    })
    psbt.addOutput({
        address: nextMultiSigAddress,
        value: change,
    })

    if (opCodesStackScript) {
        psbt.version =  0x7100
        let script = opCodesStackScript     
        psbt.addOutput({
            addreess: destAddress,
            script: script,
            value: nameFee})
    }

    // https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/test/integration/transactions.spec.ts#L131
    // How to convert partially signed transaction to hex and send to other signers 

    let psbtBaseText = psbt.toBase64();

    return { psbtBaseText, nextMultiSigAddress }
}

export async function signMultiSigTx(purpose: any, coinType: any, psbt: any) {

    // each signer imports
    let txToSign = bitcoin.Psbt.fromBase64(psbt);

    let newDerivationPath = `${purpose}/${coinType}/0/0/1`
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'hdkey' does not exist on type '{}'.
    let keyPair = s.hdkey.derive(newDerivationPath)

    // Alice signs each input with the respective private keys
    // signInput and signInputAsync are better
    // (They take the input index explicitly as the first arg)

    // To Do: Wenn mein pubkey nicht in der MultiSig ist error handling
    try {
        if (txToSign.inputCount < 2) {
            txToSign.signInput(0, keyPair)
        } else {
            txToSign.signAllInputs(keyPair);
        }
    } catch (err) {
        console.log(err)
        return
    }

    // If your signer object's sign method returns a promise, use the following
    // await signer2.signAllInputsAsync(alice2.keys[0])

    // encode to send back to combiner (signer 1 and 2 are not near each other)
    let signedTx = txToSign.toBase64();
    return signedTx
}

function createPayment(_type: any, myKeys: any, network: any) {
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'regtest'.
    network = network || regtest;
    let splitType = _type.split('-').reverse();
    let isMultisig = splitType[0].slice(0, 4) === 'p2ms';
    let keys = myKeys || [];
    let m: any
    let n: any
    if (isMultisig) {
        let match = splitType[0].match(/^p2ms\((\d+) of (\d+)\)$/);
        m = parseInt(match[1], 10);
        n = parseInt(match[2], 10);
        if (keys.length > 0 && keys.length !== n) {
            throw new Error('Need n keys for multisig');
        }
        while (!myKeys && n > 1) {
            keys.push(ECPair.makeRandom({ network }));
            n--;
        }
    }

    if (!myKeys) keys.push(ECPair.makeRandom({ network }));

    let payment: any
    splitType.forEach((type: any) => {
        if (type.slice(0, 4) === 'p2ms') {
            payment = bitcoin.payments.p2ms({
                m,
                n,
                pubkeys: myKeys, //[Buffer.from(keys[0], 'hex'), Buffer.from(keys[1], 'hex')],
                network,
            });
        } else if (['p2sh', 'p2wsh'].indexOf(type) > -1) {
            payment = (bitcoin.payments)[type]({
                redeem: payment,
                network,
            });
        } else {
            payment = (bitcoin.payments)[type]({
                pubkey: myKeys,
                network,
            });
        }
    });
    console.log('Redeem script:')
    console.log(payment.output.toString('hex'))
    return {
        payment,
        keys,
    };
}

async function getInputData(
    payment: any,
    isSegwit: any,
    redeemType: any,
    p2sh: any
) {
    let inputData = []
    let multiSigAddress = p2sh.payment.address
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'DEFAULT_NETWORK' does not exist on type ... Remove this comment to see the full error message
    let script = bitcoin.address.toOutputScript(multiSigAddress, global.DEFAULT_NETWORK)

    let hash = bitcoin.crypto.sha256(script)
    let reversedHash = Buffer.from(hash.reverse())

    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'client'.
    let unspent = await client.blockchain_scripthash_listunspent(
        reversedHash.toString("hex")
    );


    for (var i = 0; i < unspent.length; i++) {
        let balance = unspent[i].value
        multisigBalance += balance
        // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'client'.
        let utx = await client.blockchain_transaction_get(unspent[i].tx_hash, 1)

        // for non segwit inputs, you must pass the full transaction buffer
        let nonWitnessUtxo = Buffer.from(utx.hex, 'hex');
        // for segwit inputs, you only need the output script and value as an object.
        let witnessUtxo = getWitnessUtxo(utx.vout[unspent[i].tx_pos]);
        let mixin = isSegwit ? { witnessUtxo } : { nonWitnessUtxo };
        let mixin2 = {};

        switch (redeemType) {
            case 'p2sh':
                // @ts-expect-error ts-migrate(2339) FIXME: Property 'redeemScript' does not exist on type '{}... Remove this comment to see the full error message
                mixin2.redeemScript = payment.redeem.output;
                break;
            case 'p2wsh':
                // @ts-expect-error ts-migrate(2339) FIXME: Property 'witnessScript' does not exist on type '{... Remove this comment to see the full error message
                mixin2.witnessScript = payment.redeem.output;
                break;
            case 'p2sh-p2wsh':
                // @ts-expect-error ts-migrate(2339) FIXME: Property 'witnessScript' does not exist on type '{... Remove this comment to see the full error message
                mixin2.witnessScript = payment.redeem.redeem.output;
                // @ts-expect-error ts-migrate(2339) FIXME: Property 'redeemScript' does not exist on type '{}... Remove this comment to see the full error message
                mixin2.redeemScript = payment.redeem.output;
                break;
        }


        inputData.push({
            hash: unspent[i].tx_hash,
            index: unspent[i].tx_pos,
            ...mixin,
            ...mixin2,
        })
    }
    return inputData
}

function getWitnessUtxo(out: any) {
    let value = out.value
    let script = Buffer.from(out.scriptPubKey.hex, 'hex')
    out = {}
    out.value = value * 100000000
    out.script = script
    return out;
}