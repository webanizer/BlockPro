import { createRequire } from "module";
const require = createRequire(import.meta.url);
const bitcoin = require('bitcoinjs-lib')
import { returnUnusedAddress } from "./getAddress.js"
import { ECPair } from 'ecpair';
import { publishMultiSigAddress } from "../../p2p/publish.js";


export const multiSigAddress = async (receivedPubKeys, network) => {
    // TO DO: Lösung für 1. Runde und nur 1 pubKey. Evtl. normale Tx nicht multi 
    let n = receivedPubKeys.length
    let m = Math.round(n * (2 / 3))
    const p2sh = createPayment(`p2sh-p2wsh-p2ms(${m} of ${n})`, receivedPubKeys, network);
    const multiSigAddress = p2sh.payment.address

    // To Do 

    console.log("Multisig address: ", multiSigAddress)

    // publish multisig address to peers
    return p2sh
}

var multisigBalance = 0

export const multiSigTx = async (node, topic, receivedPubKeys, network, addrType, purpose, coinType, account, id, p2sh) => {

    //if this is a p2pk
    const inputData = await getInputData(
        5e4,
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
    let change = multisigBalance - reward

    let p2sh2 = await publishMultiSigAddress(node, topic, network, receivedPubKeys, purpose, coinType, id)
    let nextMultiSigAddress = p2sh.payment.address

    receivedPubKeys = []

    const psbt = new bitcoin.Psbt({ network: global.DEFAULT_NETWORK })
    for (var i = 0; i < inputData.length; i++) {
        psbt.addInput(inputData[i])
    }

    psbt.addOutput({
        address: myWinnerAddress,
        value: reward,
    })
    .addOutput({
        address: nextMultiSigAddress,
        value: change,
    })

    // To Do get own privkey for pubkey and sign 

    for (var i = 0; i < p2sh.keys.length; i++) {
        psbt.signInput(0, p2sh.keys[i])
    }
    
    // https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/test/integration/transactions.spec.ts#L131
    //  Convert partially signed transaction to hex and send to other signers 
    const psbtBaseText = psbt.toBase64();

    // publish(psbtBaseText)

    // each signer imports
    const signer1 = bitcoin.Psbt.fromBase64(psbtBaseText);
    const signer2 = bitcoin.Psbt.fromBase64(psbtBaseText);

    // Alice signs each input with the respective private keys
    // signInput and signInputAsync are better
    // (They take the input index explicitly as the first arg)
    signer1.signAllInputs(alice1.keys[0]);
    signer2.signAllInputs(alice2.keys[0]);

    // receive signedTxs and split them 
    // sign Tx with received signatures 

    psbt.validateSignaturesOfInput(0, validator, p2sh.keys[3].publicKey)

    const tx = psbt.extractTransaction();

    // broadcast raw transaction
    return tx
}

function createPayment(_type, myKeys, network) {
    network = network || regtest;
    const splitType = _type.split('-').reverse();
    const isMultisig = splitType[0].slice(0, 4) === 'p2ms';
    const keys = myKeys || [];
    let m
    let n
    if (isMultisig) {
        const match = splitType[0].match(/^p2ms\((\d+) of (\d+)\)$/);
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

    let payment
    splitType.forEach(type => {
        if (type.slice(0, 4) === 'p2ms') {
            payment = bitcoin.payments.p2ms({
                m,
                n,
                pubkeys: [Buffer.from(keys[0].publicKey, 'hex'), Buffer.from(keys[1].publicKey, 'hex')], //keys.map(key => key.publicKey).sort((a, b) => a.compare(b)),
                network,
            });
        } else if (['p2sh', 'p2wsh'].indexOf(type) > -1) {
            payment = (bitcoin.payments)[type]({
                redeem: payment,
                network,
            });
        } else {
            payment = (bitcoin.payments)[type]({
                pubkey: keys[0].publicKey,
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
    amount,
    payment,
    isSegwit,
    redeemType,
    p2sh
) {
    let inputData = []
    let multiSigAddress = p2sh.payment.address
    let script = bitcoin.address.toOutputScript(multiSigAddress, global.DEFAULT_NETWORK)

    let hash = bitcoin.crypto.sha256(script)
    let reversedHash = Buffer.from(hash.reverse())

    let unspent = await client.blockchain_scripthash_listunspent(
        reversedHash.toString("hex")
    );


    for (var i = 0; i < unspent.length; i++) {
        let balance = unspent[i].value
        multisigBalance += balance
        let utx = await client.blockchain_transaction_get(unspent[i].tx_hash, 1)

        // for non segwit inputs, you must pass the full transaction buffer
        const nonWitnessUtxo = Buffer.from(utx.hex, 'hex');
        // for segwit inputs, you only need the output script and value as an object.
        const witnessUtxo = getWitnessUtxo(utx.vout[unspent[i].tx_pos]);
        const mixin = isSegwit ? { witnessUtxo } : { nonWitnessUtxo };
        const mixin2 = {};

        switch (redeemType) {
            case 'p2sh':
                mixin2.redeemScript = payment.redeem.output;
                break;
            case 'p2wsh':
                mixin2.witnessScript = payment.redeem.output;
                break;
            case 'p2sh-p2wsh':
                mixin2.witnessScript = payment.redeem.redeem.output;
                mixin2.redeemScript = payment.redeem.output;
                break;
        }

       
        inputData.push({
            hash: unspent[i].tx_hash,
            index:unspent[i].tx_pos,
            ...mixin,
            ...mixin2,
          } )
    }
    return inputData
}

function getWitnessUtxo(out) {
    let value = out.value
    let script = Buffer.from(out.scriptPubKey.hex, 'hex')
    out = {}
    out.value = value
    out.script = script
    return out;
}