import { createRequire } from "module";
const require = createRequire(import.meta.url);
var fs = require('fs');
import path from 'path'
const __dirname = path.resolve('./');

export async function saveAddress(walletNo, chainsNo, derivationPath, address) {
    return new Promise((res, rej) => {
        let filename = `${__dirname}/derivationPaths/m${walletNo}.txt`
        try {
            if (fs.existsSync(filename)) {
                console.log("Derivation File exists")
                fs.readFile(filename, 'utf8', async function (err, data) {
                    console.log(data);

                    var rl = require('readline').createInterface({
                        input: require('fs').createReadStream(filename),
                      });
                    // Note: we use the crlfDelay option to recognize all instances of CR LF
                    // ('\r\n') in input.txt as a single line break.
                    let index
                    let readDerivationPath
                    let readAddress

                    // check if new address is already in local storage. If yes return derivationPath
                    for await (const line of rl) {
                        // Each line in input.txt will be successively available here as `line`.
                        console.log(`Line from file: ${line}`);
                        let lineParts = line.split(",")
                        index = lineParts[0]
                        readDerivationPath = lineParts[1].trim()
                        readAddress = lineParts[2].trim()
                        if (readAddress == address) {
                            console.log("address already saved. Returning Derivation Path: ", derivationPath)
                            res(readDerivationPath) 
                        }
                    }

                    // new address is not yet in local storage: Increase last saved derivationPath and Index and save address
                    let lastAddressIndex = readDerivationPath.split("/")[3]

                    if (derivationPath == undefined && address == undefined){
                        res([readDerivationPath, readAddress])
                    }

                    let newDerivationPath
                    if (derivationPath == undefined){
                         newDerivationPath = `m/${walletNo}/${chainsNo}/${++lastAddressIndex}`
                    }else{
                        newDerivationPath = derivationPath
                    }

                    if (address !== undefined) {
                        let newLine = `${++index}, ${newDerivationPath}, ${address}  \r\n`
                        fs.appendFile(filename , newLine, function (err) {
                            if (err) throw err;
                            console.log('Appended new address and derivationPath to local storage!');
                        });
                    } 
                    res(newDerivationPath)

                });
            } else {
                throw err
            }
        } catch (err) {
            console.log("No addresses saved yet. Creating new derivationPath file")

            // save in local file 
            let newDerivationPath = `m/${walletNo}/${chainsNo}/0`
            if (address !== undefined){
            fs.writeFile(filename, `0, ${newDerivationPath}, ${address} \r\n`, function (err) {
                if (err) throw err;
                console.log('Saved first address and derivationPath');               
            });
            }
            res(newDerivationPath)
        }
    })
}

export async function getSavedAddresses(walletNo){
    return new Promise((res, rej) => {
        let filename = `${__dirname}/derivationPaths/m${walletNo}.txt`
        try {
            if (fs.existsSync(filename)) {
                console.log("Derivation File exists")
                fs.readFile(filename, 'utf8', async function (err, data) {
                    console.log(data);

                    var rl = require('readline').createInterface({
                        input: require('fs').createReadStream(filename),
                      });
                    // Note: we use the crlfDelay option to recognize all instances of CR LF
                    // ('\r\n') in input.txt as a single line break.
                    
                    let pathsAndAddresses = []

                    // check if new address is already in local storage. If yes return derivationPath
                    for await (const line of rl) {
                        // Each line in input.txt will be successively available here as `line`.
                        console.log(`Line from file: ${line}`);
                        let lineParts = line.split(",")
                        let readDerivationPath = lineParts[1].trim()
                        let readAddress = lineParts[2].trim()
                        pathsAndAddresses.push({readDerivationPath, readAddress})
                    }
                    res(pathsAndAddresses)

                });
            } else {
                throw err
            }
        } catch (err) {
            console.log("No addresses saved yet. Create new derivationPath file")
            rej()
        }
    })
}