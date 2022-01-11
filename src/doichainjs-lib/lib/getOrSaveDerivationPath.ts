// @ts-expect-error ts-migrate(2305) FIXME: Module '"module"' has no exported member 'createRe... Remove this comment to see the full error message
import { createRequire } from "module";
// @ts-expect-error ts-migrate(2441) FIXME: Duplicate identifier 'require'. Compiler reserves ... Remove this comment to see the full error message
const require = createRequire(import.meta.url);
var fs = require('fs');
import path from 'path'
const __dirname = path.resolve('./');

export async function saveAddress(purpose: any, derivationPath: any, address: any, id: any) {
    return new Promise((res, rej) => {
        let filename = `${__dirname}/derivationPaths/${purpose.replace("/", "")}-${id}.txt`
        try {
            if (fs.existsSync(filename)) {
                console.log("Derivation File exists")
                fs.readFile(filename, 'utf8', async function (err: any, data: any) {
                    console.log(data);

                    // check if new address is already in local storage. If yes return derivationPath
                    if (data.indexOf(address) !== -1) {
                        console.log("address already saved.")
                        // @ts-expect-error ts-migrate(2794) FIXME: Expected 1 arguments, but got 0. Did you forget to... Remove this comment to see the full error message
                        res()
                        return
                    }

                    let newDerivationPath = derivationPath
                    let dataParts = data.split(";")
                    let index = dataParts[dataParts.length-1].split(",")[0]
                
                    if (address !== undefined) {
                        let newLine = `;${++index}, ${newDerivationPath}, ${address}  \r\n`
                        fs.appendFile(filename, newLine, function (err: any) {
                            if (err) throw err;
                            console.log('Appended new address and derivationPath to local storage!');
                            // @ts-expect-error ts-migrate(2794) FIXME: Expected 1 arguments, but got 0. Did you forget to... Remove this comment to see the full error message
                            res()
                        });
                    }

                });
            } else {
                // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'err'.
                throw err
            }
        } catch (err) {
            console.log("No addresses saved yet. Creating new derivationPath file")

            // save in local file 
            if (address !== undefined) {
                fs.writeFile(filename, `;0, ${derivationPath}, ${address} \r\n`, function (err: any) {
                    if (err) throw err;
                    console.log('Saved first address and derivationPath');
                    // @ts-expect-error ts-migrate(2794) FIXME: Expected 1 arguments, but got 0. Did you forget to... Remove this comment to see the full error message
                    res()
                });
            }
        }
    });
}

export async function getSavedAddresses(purpose: any, id: any) {
    return new Promise((res, rej) => {
        let filename = `${__dirname}/derivationPaths/${purpose.replace("/", "")}-${id}.txt`
        try {
            if (fs.existsSync(filename)) {
                console.log("Derivation File exists")
                fs.readFile(filename, 'utf8', async function (err: any, data: any) {
                    
                    var rl = require('readline').createInterface({
                        input: require('fs').createReadStream(filename),
                    });
                    // Note: we use the crlfDelay option to recognize all instances of CR LF
                    // ('\r\n') in input.txt as a single line break.

                    let pathsAndAddresses = []

                    // check if new address is already in local storage. If yes return derivationPath
                    for await (const line of rl) {
                        // Each line in input.txt will be successively available here as `line`.
                        let lineParts = line.split(",")
                        let readDerivationPath = lineParts[1].trim()
                        let readAddress = lineParts[2].trim()
                        pathsAndAddresses.push({ readDerivationPath, readAddress })
                    }
                    res(pathsAndAddresses)

                });
            } else {
                // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'err'.
                throw err
            }
        } catch (err) {
            console.log("No addresses saved yet. Create new derivationPath file")
            // @ts-expect-error ts-migrate(2794) FIXME: Expected 1 arguments, but got 0. Did you forget to... Remove this comment to see the full error message
            res()
        }
    });
}