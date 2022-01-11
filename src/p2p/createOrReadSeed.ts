// @ts-expect-error ts-migrate(2305) FIXME: Module '"module"' has no exported member 'createRe... Remove this comment to see the full error message
import { createRequire } from "module";
// @ts-expect-error ts-migrate(2441) FIXME: Duplicate identifier 'require'. Compiler reserves ... Remove this comment to see the full error message
const require = createRequire(import.meta.url);
import { generateMnemonic } from '../doichainjs-lib/lib/generateMnemonic.js'
import { createHdKeyFromMnemonic, encryptAES, decryptAES, network } from '../doichainjs-lib/index.js';
import { s } from "./sharedState.js";
import path from 'path'
const __dirname = path.resolve('./');
var fs = require('fs');

var password1
// @ts-expect-error ts-migrate(2339) FIXME: Property 'password' does not exist on type '{}'.
s.password = password1 ? password1 : "mnemonic"

export async function createOrReadSeed(id: any) {
    return new Promise((res, rej) => {
        let filename = `${__dirname}/encryptedS${id}.txt`
        try {
            if (fs.existsSync(filename)) {
                console.log("Seed phrase exists")
                fs.readFile(filename, 'utf8', async function (err: any, data: any) {
                    // @ts-expect-error ts-migrate(2339) FIXME: Property 'seed' does not exist on type '{}'.
                    s.seed = decryptAES(data, s.password)
                    // generate hd key 
                    // @ts-expect-error ts-migrate(2339) FIXME: Property 'hdkey' does not exist on type '{}'.
                    s.hdkey = createHdKeyFromMnemonic(s.seed, s.password)
                    console.log("Read Existing Seed from storage");
                    // @ts-expect-error ts-migrate(2794) FIXME: Expected 1 arguments, but got 0. Did you forget to... Remove this comment to see the full error message
                    res()
                });
            }else{
                // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'err'.
                throw err
            }
        } catch (err) {
            console.log("No Seed yet. Creating new one")

            // @ts-expect-error ts-migrate(2339) FIXME: Property 'seed' does not exist on type '{}'.
            s.seed = generateMnemonic();

            // generate hd key and encrypt with password
            // @ts-expect-error ts-migrate(2339) FIXME: Property 'hdkey' does not exist on type '{}'.
            s.hdkey = createHdKeyFromMnemonic(s.seed, s.password)
            // @ts-expect-error ts-migrate(2339) FIXME: Property 'seed' does not exist on type '{}'.
            const encryptedS = encryptAES(s.seed, s.password)

            // save in local file 

            fs.writeFile(filename, `${encryptedS}`, function (err: any) {
                if (err) throw err;
                console.log('Saved new encrypted seed phrase!');
                // @ts-expect-error ts-migrate(2794) FIXME: Expected 1 arguments, but got 0. Did you forget to... Remove this comment to see the full error message
                res()
            });
        }
    });
}