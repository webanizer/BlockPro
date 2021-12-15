import { createRequire } from "module";
const require = createRequire(import.meta.url);
import { generateMnemonic } from '../doichainjs-lib/lib/generateMnemonic.js'
import { createHdKeyFromMnemonic, encryptAES, decryptAES, network } from '../doichainjs-lib/index.js';
import { sharedStateObject } from "./sharedState.js";
import path from 'path'
const __dirname = path.resolve('./');
var fs = require('fs');

var password1
sharedStateObject.password = password1 ? password1 : "mnemonic"

export async function createOrReadSeed(id) {
    return new Promise((res, rej) => {
        let filename = `${__dirname}/encryptedS${id}.txt`
        try {
            if (fs.existsSync(filename)) {
                console.log("Seed phrase exists")
                fs.readFile(filename, 'utf8', async function (err, data) {
                    global.seed = decryptAES(data, sharedStateObject.password)
                    // generate hd key 
                    sharedStateObject.hdkey = createHdKeyFromMnemonic(seed, sharedStateObject.password)
                    console.log("Read Existing Seed from storage");
                    res()
                });
            }else{
                throw err
            }
        } catch (err) {
            console.log("No Seed yet. Creating new one")

            global.seed = generateMnemonic();

            // generate hd key and encrypt with password
            sharedStateObject.hdkey = createHdKeyFromMnemonic(seed, sharedStateObject.password)
            const encryptedS = encryptAES(seed, sharedStateObject.password)

            // save in local file 

            fs.writeFile(filename, `${encryptedS}`, function (err) {
                if (err) throw err;
                console.log('Saved new encrypted seed phrase!');
                res()
            });
        }
    })
}