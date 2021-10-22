import { createRequire } from "module";
const require = createRequire(import.meta.url);
const bitcoin = require("bitcoinjs-lib")


export const getAddress = (publicKey, network, addrType, newDerivationPath) => {
    if (!network) network = global.DEFAULT_NETWORK
    let address
    let xpub = hdkey.publicExtendedKey


    if (addrType == "legacy") {
        var payment = bitcoin.payments.p2pkh({
            pubkey: publicKey,
            network: network.network,
        });
        address = payment.address
        console.log('legacy address ', address)

    } else if (addrType == "p2wpkh") {
        // let pubkey = bitcoin.bip32.fromBase58(xpub, network.network).derivePath(newDerivationPath).publicKey

        var payment = bitcoin.payments.p2wpkh({
            pubkey: publicKey,
            network: network.network
        })


        address = payment.address;
        console.log("p2wpkh address ", address)


    } else if (addrType == "p2sh") {
        // let pubkey = bitcoin.bip32.fromBase58(xpub, network.network).derivePath("m/84/1/0").publicKey

        var payment = bitcoin.payments.p2sh({
            redeem: bitcoin.payments.p2wpkh({
                pubkey: publicKey,
                network: network.network
            })
        })

        address = payment.address;
        console.log("p2sh address ", address)
    }

    return address
}
export default getAddress
