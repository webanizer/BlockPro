import { createRequire } from "module";
const require = createRequire(import.meta.url);
const bitcoin = require("bitcoinjs-lib")

export const getUnspents = async (wallet) => {
    const inputs = []


    //check which still have money
    for (const addr of wallet.addresses) {
        // console.log('checking addr', addr)

        //if this is a p2pkh
        let script = bitcoin.address.toOutputScript(addr.address, global.DEFAULT_NETWORK)

        let hash = bitcoin.crypto.sha256(script)
        let reversedHash = Buffer.from(hash.reverse())

        let UTXOs = await client.blockchain_scripthash_listunspent(
            reversedHash.toString("hex")
        );

        if (UTXOs.length > 0) {
            inputs.push({UTXOs,"address":addr})
        }
        console.info('added UTXOs')

    }

    return inputs
}
export default getUnspents
