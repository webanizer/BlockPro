import { createRequire } from "module"; 
const require = createRequire(import.meta.url); 
const bitcoin = require("bitcoinjs-lib")

export const getAddressOfInput = (input) => {
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
            network: network,
        }).address;
    }
    console.warn('input address',address)
    return address
}