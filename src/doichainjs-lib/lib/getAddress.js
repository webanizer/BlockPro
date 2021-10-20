import { createRequire } from "module";
const require = createRequire(import.meta.url);
const bitcoin = require("bitcoinjs-lib")

export const getAddress = (publicKey, network, addrType) => {
    if (!network) network = global.DEFAULT_NETWORK
    let address 

    if (addrType == "legacy") {
        address = bitcoin.payments.p2pkh({
            pubkey: publicKey,
            network: network,
        });
        console.log('legacy address', address)

    } else if (addrType == "p2wpkh") {
        let p2wpkh = bitcoin.payments.p2wpkh({ pubkey: publicKey, network })
        address = p2wpkh.address
        console.log('p2wpkh address', address)

    } else if (addrType == "p2sh") {
        let p2wpkh = bitcoin.payments.p2wpkh({ pubkey: publicKey, network })
        address = bitcoin.payments.p2sh({ redeem: p2wpkh, network }).address
        console.log('p2sh address', address)
    }
    return address
}
export default getAddress
