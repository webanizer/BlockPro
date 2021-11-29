import { createRequire } from "module";
const require = createRequire(import.meta.url);
const bitcoin = require('bitcoinjs-lib')
import { returnUnusedAddress } from "./getAddress.js"
import { ECPair } from 'ecpair';


export const multiSigTx = async (receivedPubKeys, network, addrType, purpose, coinType, id) => {
    // TO DO: Lösung für 1. Runde und nur 1 pubKey. Evtl. normale Tx nicht multi 
    if (receivedPubKeys.length == 1){
        let spareKeys = ECPair.makeRandom({ network })
        receivedPubKeys.push(spareKeys.publicKey)
    }
    let n = receivedPubKeys.length
    let m = Math.round(n*(2/3))
    const p2sh = createPayment(`p2sh-p2wsh-p2ms(${m} of ${n})`, receivedPubKeys, network);
    const multiSigAddress = p2sh.payment.address

    // To Do 

    console.log("Multisig address: ", multiSigAddress)

    // publish multisig address to peers

    
    const inputData = await getInputData(
        5e4,
        p2sh.payment,
        true,
        'p2sh-p2wsh',
    );
    {
        const {
            hash,
            index,
            witnessUtxo,
            redeemScript,
            witnessScript,
        } = inputData;

    }

    let receiving = true
    let myWinnerAddress = returnUnusedAddress(network, addrType, purpose, coinType, receiving, id)
    let bounty = 0.01
    let nextMultiSigAddress
    let change = multisigBalance - bounty

    const psbt = new bitcoin.Psbt({ network: global.DEFAULT_NETWORK })
        .addInput(inputData)
        .addOutput({
            address: myWinnerAddress,
            value: bounty,
        })
        .addOutput({
            address: nextMultiSigAddress,
            value: change,
        })
    /*    .signInput(0, p2sh.keys[0])
        .signInput(0, p2sh.keys[2])
        .signInput(0, p2sh.keys[3]);

    psbt.validateSignaturesOfInput(0, validator, p2sh.keys[3].publicKey)

    const tx = psbt.extractTransaction();
    return tx*/
    return psbt
}

function createPayment(_type, myKeys, network) {
    network = network || regtest;
    const splitType = _type.split('-').reverse();
    const isMultisig = splitType[0].slice(0, 4) === 'p2ms';
    const keys = myKeys || [];
    let m
    if (isMultisig) {
        const match = splitType[0].match(/^p2ms\((\d+) of (\d+)\)$/);
        m = parseInt(match[1], 10);
        let n = parseInt(match[2], 10);
        if (keys.length > 0 && keys.length !== n) {
            throw new Error('Need n keys for multisig');
        }
        while (!myKeys && n > 1) {
            keys.push(ECPair.makeRandom({ network }));
            n--;
        }
    }

    if (!myKeys ) keys.push(ECPair.makeRandom({ network }));

    let payment
    splitType.forEach(type => {
        if (type.slice(0, 4) === 'p2ms') {
            payment = bitcoin.payments.p2ms({
                m,
                pubkeys: [Buffer.from(keys[0], 'hex'),Buffer.from(keys[1], 'hex')],//keys.map(key => key.publicKey).sort((a, b) => a.compare(b)),
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
  ) {
    const unspent = await regtestUtils.faucetComplex(payment.output, amount);
    const utx = await regtestUtils.fetch(unspent.txId);
    // for non segwit inputs, you must pass the full transaction buffer
    const nonWitnessUtxo = Buffer.from(utx.txHex, 'hex');
    // for segwit inputs, you only need the output script and value as an object.
    const witnessUtxo = getWitnessUtxo(utx.outs[unspent.vout]);
    const mixin = isSegwit ? { witnessUtxo } : { nonWitnessUtxo };
    const mixin2= {};
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
    return {
      hash: unspent.txId,
      index: unspent.vout,
      ...mixin,
      ...mixin2,
    };
  }

