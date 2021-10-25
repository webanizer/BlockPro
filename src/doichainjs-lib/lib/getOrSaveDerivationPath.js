import { createRequire } from "module";
import { resolve } from "path";
const require = createRequire(import.meta.url);
var fs = require('fs');
const readline = require('readline');

export async function getOrSaveDerivationPath(walletNo, chainsNo, derivationPath, address) {
    return new Promise((res, rej) => {
        try {
            if (fs.existsSync("./derivationPaths.txt")) {
                console.log("Derivation File exists")
                fs.readFile('./derivationPaths.txt', 'utf8', async function (err, data) {
                    console.log(data);

                    const rl = readline.createInterface({
                        input: data,
                        crlfDelay: Infinity
                    });
                    // Note: we use the crlfDelay option to recognize all instances of CR LF
                    // ('\r\n') in input.txt as a single line break.
                    let index
                    let readDerivationPath

                    // check if new address is already in local storage. If yes return derivationPath

                    for await (const line of rl) {
                        // Each line in input.txt will be successively available here as `line`.
                        console.log(`Line from file: ${line}`);
                        let lineParts = line.split(",")
                        index = lineParts[0]
                        readDerivationPath = lineParts[1]
                        let readAddress = lineParts[2]
                        if (address !== undefined && readAddress == address) {
                            console.log("address already saved. Returning Derivation Path: ", derivationPath)
                            res()
                            return readDerivationPath
                        }
                    }

                    // new address is not yet in local storage: Increase last saved derivationPath and Index and save address
                    let lastAddressIndex = readDerivationPath.split("/")[3]

                    let newDerivationPath
                    if (derivationPath !== undefined){
                         newDerivationPath = `m/${walletNo}/${chainsNo}/${++lastAddressIndex}`
                    }else{
                        newDerivationPath = derivationPath
                    }

                    if (address !== undefined) {
                        let newLine = `${++index}, ${newDerivationPath}, ${address}  \r\n`
                        fs.appendFile('derivationPaths.txt', newLine, function (err) {
                            if (err) throw err;
                            console.log('Appended new address and derivationPath to local storage!');
                            res()
                            return newDerivationPath
                        });
                    } else {
                        res()
                        return newDerivationPath
                    }
                });
            } else {
                throw err
            }
        } catch (err) {
            console.log("No addresses saved yet. Creating new derivationPath file")

            // save in local file 
            let newDerivationPath = `m/${walletNo}/${chainsNo}/0`
            if (address !== undefined){
            fs.writeFile('derivationPaths.txt', `0, ${newDerivationPath}, ${address} \r\n`, function (err) {
                if (err) throw err;
                console.log('Saved first address and derivationPath');
                res()
                return newDerivationPath
            });
            }else{
                res()
                return newDerivationPath
            }
        }
    })
}