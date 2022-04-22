import { createRequire } from "module";
const require = createRequire(import.meta.url);
const bitcoin = require('bitcoinjs-lib')
var conv = require('binstring')
import base58 from 'bs58'
import { returnUnusedAddress } from "./getAddress.js"
import pkg from 'ecpair';
const { ECPair } = pkg;
import { s } from "../../p2p/sharedState.js";
import { getByteCount } from "../lib/getByteCount.js"
import { keys } from "libp2p-crypto";
import { getKeyPair } from "../../p2p/publish.js";

export const multiSigAddress =  (network, receivedPubKeys) => {
    // TO DO: Lösung für 1. Runde und nur 1 pubKey. Evtl. normale Tx nicht multi 
    if (s.nNew == undefined) {
        s.nNew = receivedPubKeys.length
        s.mNew = Math.round(s.nNew * (2 / 3))
    }
    s.nOld = s.nNew
    s.mOld = s.mNew
    s.nNew = receivedPubKeys.length
    s.mNew = Math.round(s.nNew * (2 / 3))
    var p2sh = createPayment(`p2sh-p2wsh-p2ms(${s.mNew} of ${s.nNew})`, receivedPubKeys, network);

    var multiSigAddress = p2sh.payment.address

    console.log("Multisig address: ", multiSigAddress)

    // publish multisig address to peers
    return p2sh
}

var multisigBalance = 0

export const multiSigTx = async (network, addrType, purpose, coinType, account, id, p2sh, receivedPubKeys, hdkey, topicReward, cid, hash) => {

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

    // To Do: Wenn ohne Peers, dann keine neue Multisig generieren. Wechselgeld bleibt auf dem selben Wallet
    s.p2sh = multiSigAddress(network, receivedPubKeys)
    let nextMultiSigAddress = s.p2sh.payment.address

    let psbt = new bitcoin.Psbt({ network: global.DEFAULT_NETWORK })
    for (var i = 0; i < inputData.length; i++) {
        psbt.addInput(inputData[i])
    }

    let fee
    let estimatedVsize
    let inputType = `MULTISIG-P2SH-P2WSH:${s.mOld}-${s.nOld}`
    let addressType = `${s.addrType}`
    addressType = addressType.toUpperCase()

    if (opCodesStackScript) {
        estimatedVsize = getByteCount({ [inputType]: inputData.length }, { [addressType]: 3 })
    } else {
        estimatedVsize = getByteCount({ [inputType]: inputData.length }, { [addressType]: 2 })
    }

    // To Do: Nach Lasttest mit vollem Mempool ändern 
    // Currently 1 schwarz pro Byte. Current bitcoin ca. 6/7 sat/Byte
    fee = (estimatedVsize + 120) * 100 //wegen Regtest * 100 sonst ohne

    let change

    // To Do: Check einbauen ob multisig ne balance hat

    if (opCodesStackScript) {
        change = multisigBalance - reward - fee - nameFee
    } else {
        change = multisigBalance - reward - fee
    }

    psbt.addOutput({
        address: myWinnerAddress,
        value: reward
    })
    psbt.addOutput({
        address: nextMultiSigAddress,
        value: change
    })


    if (opCodesStackScript) {
        psbt.version = 0x7100
        let script = opCodesStackScript
        psbt.addOutput({
            addreess: destAddress,
            script: script,
            value: nameFee
        })
    }

    // https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/test/integration/transactions.spec.ts#L131
    // How to convert partially signed transaction to hex and send to other signers 

    let psbtBaseText = psbt.toBase64();

    return { psbtBaseText, nextMultiSigAddress }
}

export async function signMultiSigTx(psbt) {

    // each signer imports
    let txToSign = bitcoin.Psbt.fromBase64(psbt);

    // let newDerivationPath = `${purpose}/${coinType}/0/0/1`
    // let keyPair = s.hdkey.derive(newDerivationPath)

    let nextDerPath = s.lastDerPath.split("/")[1]

    let lastDerPath
    if (s.lastDerPath == "0/2") {
        lastDerPath = `${s.lastDerPath.split("/")[0]}/${--nextDerPath}`
    } else {
        nextDerPath = --nextDerPath
        lastDerPath = `${s.lastDerPath.split("/")[0]}/${--nextDerPath}`
    }

    console.log("trying to sign with: " + lastDerPath)

    let keyPair
    if (s.signWithCurrent !== undefined) {
        console.log("signing with: " + s.signWithCurrent)
        keyPair = getKeyPair(`${s.basePath}/${s.signWithCurrent}`)
    } else {
        keyPair = getKeyPair(`${s.basePath}/${lastDerPath}`)
    }

    // To Do: Wenn mein pubkey nicht in der MultiSig ist error handling
    try {
        if (txToSign.inputCount < 2) {
            txToSign.signInput(0, keyPair)
        } else {
            txToSign.signAllInputs(keyPair);
        }
        // encode to send back to combiner (signer 1 and 2 are not near each other)
        let signedTx = txToSign.toBase64();
        return signedTx
    } catch (err) {
        console.log(err)
        return
    }

    // If your signer object's sign method returns a promise, use the following
    // await signer2.signAllInputsAsync(alice2.keys[0])

}

function createPayment(_type, myKeys, network) {
    network = network || regtest;
    let splitType = _type.split('-').reverse();
    let isMultisig = splitType[0].slice(0, 4) === 'p2ms';
    let keys = myKeys || [];
    let m
    let n
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

    let payment
    splitType.forEach(type => {
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

    multisigBalance = 0
    for (var i = 0; i < unspent.length; i++) {
        // inputAmount += input.witnessUtxo.value
        let balance = unspent[i].value
        multisigBalance += balance
        let utx = await client.blockchain_transaction_get(unspent[i].tx_hash, 1)

        // for non segwit inputs, you must pass the full transaction buffer
        let nonWitnessUtxo = Buffer.from(utx.hex, 'hex');
        // for segwit inputs, you only need the output script and value as an object.
        let witnessUtxo = getWitnessUtxo(utx.vout[unspent[i].tx_pos]);
        let mixin = isSegwit ? { witnessUtxo } : { nonWitnessUtxo };
        let mixin2 = {};

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
            index: unspent[i].tx_pos,
            ...mixin,
            ...mixin2,
        })
    }
    return inputData
}

function getWitnessUtxo(out) {
    let value = out.value
    let script = Buffer.from(out.scriptPubKey.hex, 'hex')
    out = {}
    out.value = value * 100000000
    out.script = script
    return out;
}