const fs = require('fs');
const fsPromise = require('fs/promises')
const path = require('path');
const csv = require('@fast-csv/format');


async function writeWinnerToLog(iteration, winnerPeerId, solutionNumber) {

    let timestamp = new Date().toLocaleString("de-DE", { timeZone: "Europe/Berlin" })

    class CsvFile {
        static write(filestream, rows, options) {
            return new Promise((res, rej) => {
                csv.writeToStream(filestream, rows, options)
                    .on('error', err => rej(err))
                    .on('finish', () => res());
            });
        }

        constructor(opts) {
            this.headers = opts.headers;
            this.path = opts.path;
            this.writeOpts = { headers: this.headers, includeEndRowDelimiter: true };
        }

        create(rows) {
            return CsvFile.write(fs.createWriteStream(this.path), rows, { ...this.writeOpts });
        }

        append(rows) {
            return CsvFile.write(fs.createWriteStream(this.path, { flags: 'a' }), rows, {
                ...this.writeOpts,
                // dont write the headers when appending
                writeHeaders: false,
            });
        }

        async read() {
                var contents = await fsPromise.readFile(this.path);
                return contents
        }
    }

    const csvFile = new CsvFile({
        path: path.resolve(__dirname, process.env.LOG),
        // headers to write
        headers: ['index', 'timestamp', 'winnerPeerId', 'solutionNumber'],
    });

    var content = await csvFile.read()
    // 1. Check if csv file exists
    if (content.length == 0) {
        // 1. create the csv
        await csvFile
            .create([
                { index: `${iteration}`, timestamp: `${timestamp}`, winnerPeerId: `${winnerPeerId}`, solutionNumber: `${solutionNumber}` }
            ])
            .then(() => csvFile.read())
            .then(contents => {
                console.log(`${contents}`);
            })
            .catch(err => {
                console.error(err.stack);
                process.exit(1);
            });
    } else {
        await csvFile.read()
            // append rows to file
            .then(() =>
                csvFile.append([
                    { index: `${iteration}`, timestamp: `${timestamp}`, winnerPeerId: `${winnerPeerId}`, solutionNumber: `${solutionNumber}` }
                ]),
            )
            // append another row
            .then(() => csvFile.read())
            .then(contents => {
                console.log(`${contents}`);
            })
            .catch(err => {
                console.error(err.stack);
                process.exit(1);
            });
    }

}
module.exports.writeWinnerToLog = writeWinnerToLog;

