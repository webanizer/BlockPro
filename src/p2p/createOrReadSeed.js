import { createRequire } from "module";
const require = createRequire(import.meta.url);
import { generateMnemonic } from 'doichainjs-lib'
import { createHdKeyFromMnemonic, encryptAES, decryptAES, network } from 'doichainjs-lib';
import { s } from "./sharedState.js";
import path from 'path'
const __dirname = path.resolve('./');
var fs = require('fs');

var password1
s.password = password1 ? password1 : "mnemonic"

export async function createOrReadSeed(id) {
    return new Promise((res, rej) => {
        let filename = `${__dirname}/encryptedS${id}.txt`
        try {
            if (fs.existsSync(filename)) {
               // console.log("Seed phrase exists")
                fs.readFile(filename, 'utf8', async function (err, data) {
                    s.seed = decryptAES(data, s.password)
                    // generate hd key 
                    s.hdkey = createHdKeyFromMnemonic(s.seed, s.password)
                 //   console.log("Read Existing Seed from storage");
                    res()
                });
            }else{
                throw err
            }
        } catch (err) {
       //     console.log("No Seed yet. Creating new one")

            s.seed = generateMnemonic();

            // generate hd key and encrypt with password
            s.hdkey = createHdKeyFromMnemonic(s.seed, s.password)
            const encryptedS = encryptAES(s.seed, s.password)

            // save in local file 

            fs.writeFile(filename, `${encryptedS}`, function (err) {
                if (err) throw err;
                //console.log('Saved new encrypted seed phrase!');
                res()
            });
        }
    })
}