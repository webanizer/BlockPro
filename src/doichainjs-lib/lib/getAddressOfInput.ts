// @ts-expect-error ts-migrate(2305) FIXME: Module '"module"' has no exported member 'createRe... Remove this comment to see the full error message
import { createRequire } from "module"; 
// @ts-expect-error ts-migrate(2441) FIXME: Duplicate identifier 'require'. Compiler reserves ... Remove this comment to see the full error message
const require = createRequire(import.meta.url); 
const bitcoin = require("bitcoinjs-lib")

export const getAddressOfInput = (input: any) => {
    const chunks = bitcoin.script.decompile(
        Buffer.from(input.script, "hex")
    );
    //this is a coin transaction
    const asmScript = bitcoin.script.toASM(chunks)
    const dec = asmScript.split(" ")[1];
    let address = "coinbase"
    if (dec !== undefined) {
        if (dec === undefined) {
            console.error(bitcoin.script.toASM(chunks), "undefined dec!!!")
        }
        address = bitcoin.payments.p2pkh({
            pubkey: Buffer.from(dec, "hex"),
            // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'network'.
            network: network,
        }).address;
    }
    console.warn('input address',address)
    return address
}