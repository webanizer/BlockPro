const bitcoin = require("bitcoinjs-lib")

export const getAddress = (publicKey, network) => {
    if(!network) network = global.DEFAULT_NETWORK
    const { address } = bitcoin.payments.p2pkh({
        pubkey: publicKey,
        network: network,
    });
    return address
}
export default getAddress
