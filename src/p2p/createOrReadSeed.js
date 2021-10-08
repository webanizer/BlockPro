import { createRequire } from "module";
const require = createRequire(import.meta.url);
import { generateMnemonic } from '../doichainjs-lib/lib/generateMnemonic.js'
import { createHdKeyFromMnemonic, encryptAES, decryptAES, network } from '../doichainjs-lib/index.js';
import { resolve } from "path";
var fs = require('fs');

var password1
const password = password1 ? password1 : "mnemonic"

export async function createOrReadSeed() {
    return new Promise((res, rej) => {
        try {
            if (fs.existsSync("./encryptedS.txt")) {
                console.log("Seed phrase exists")
                fs.readFile('./encryptedS.txt', 'utf8', async function (err, data) {
                    global.seed = decryptAES(data, password)
                    // generate hd key 
                    global.hdkey = createHdKeyFromMnemonic(seed, password)
                    console.log("Read Existing Seed from storage");
                    res()
                });
            }
        } catch (err) {
            console.log("No Seed yet. Creating new one")

            global.seed = generateMnemonic();

            // generate hd key and encrypt with password
            global.hdkey = createHdKeyFromMnemonic(seed, password)
            const encryptedS = encryptAES(seed, password)

            // save in local file 

            fs.writeFile('encryptedS.txt', `${encryptedS}`, function (err) {
                if (err) throw err;
                console.log('Saved new encrypted seed phrase!');
                res()
            });
        }
    })
}