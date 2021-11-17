import { createRequire } from "module";
const require = createRequire(import.meta.url);
const bitcoin = require('bitcoinjs-lib')
import getAddress from "./getAddress.js"


export const createMultiSigAddress = async () => {
    // it can generate a P2SH, pay-to-multisig (2-of-3) address
    const pubkeys = [
        '026477115981fe981a6918a6297d9803c4dc04f328f22041bedff886bbc2962e01',
        '02c96db2302d19b43d4c69368babace7854cc84eb9e061cde51cfa77ca4a22b8b9',
        '03c6103b3b83e4a24a0e33a4df246ef11772f9992663db0c35759a5e2ebf68d8e9',
    ].map(hex => Buffer.from(hex, 'hex'));
    const { address } = bitcoin.payments.p2sh({
        redeem: bitcoin.payments.p2ms({ m: 2, pubkeys }),
    });
    return address
    // '36NUkt6FWUi3LAWBqWRdDmdTWbt91Yvfu7'
}

export const createMultiSigAddress = async () => {
    // it can generate a P2WSH (SegWit), pay-to-multisig (3-of-4) address
    const pubkeys = [
        '026477115981fe981a6918a6297d9803c4dc04f328f22041bedff886bbc2962e01',
        '02c96db2302d19b43d4c69368babace7854cc84eb9e061cde51cfa77ca4a22b8b9',
        '023e4740d0ba639e28963f3476157b7cf2fb7c6fdf4254f97099cf8670b505ea59',
        '03c6103b3b83e4a24a0e33a4df246ef11772f9992663db0c35759a5e2ebf68d8e9',
    ].map(hex => Buffer.from(hex, 'hex'));
    const { address } = bitcoin.payments.p2wsh({
        redeem: bitcoin.payments.p2ms({ m: 3, pubkeys }),
    });

    // 'bc1q75f6dv4q8ug7zhujrsp5t0hzf33lllnr3fe7e2pra3v24mzl8rrqtp3qul'   
}

export const multiSigTx = async (receivedPubKeys, purpose, coinType) => {
    let n = receivedPubKeys.length
    let m = Math.round(n*(2/3))
    const p2sh = createPayment(`p2sh-p2wsh-p2ms(${m} of ${n})`);
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
        assert.deepStrictEqual(
            { hash, index, witnessUtxo, redeemScript, witnessScript },
            inputData,
        );
    }

    let receiving = true
    let myWinnerAddress = getAddress(network, addrType, purpose, coinType, receiving)
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
    if (!myKeys) keys.push(ECPair.makeRandom({ network }));

    let payment
    splitType.forEach(type => {
        if (type.slice(0, 4) === 'p2ms') {
            payment = bitcoin.payments.p2ms({
                m,
                pubkeys: keys.map(key => key.publicKey).sort((a, b) => a.compare(b)),
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
}

