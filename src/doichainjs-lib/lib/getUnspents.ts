// @ts-expect-error ts-migrate(2305) FIXME: Module '"module"' has no exported member 'createRe... Remove this comment to see the full error message
import { createRequire } from "module";
// @ts-expect-error ts-migrate(2441) FIXME: Duplicate identifier 'require'. Compiler reserves ... Remove this comment to see the full error message
const require = createRequire(import.meta.url);
const bitcoin = require("bitcoinjs-lib")

export const getUnspents = async (wallet: any) => {
    const inputs = []


    //check which still have money
    for (const addr of wallet.addresses) {
        // console.log('checking addr', addr)

        //if this is a p2pkh
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'DEFAULT_NETWORK' does not exist on type ... Remove this comment to see the full error message
        let script = bitcoin.address.toOutputScript(addr.address, global.DEFAULT_NETWORK)

        let hash = bitcoin.crypto.sha256(script)
        let reversedHash = Buffer.from(hash.reverse())

        // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'client'.
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
