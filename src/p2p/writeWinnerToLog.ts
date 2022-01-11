import fs from 'fs'
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module 'fs/promises' or its correspond... Remove this comment to see the full error message
import fsPromise from 'fs/promises'
import csv from '@fast-csv/format'
import path from 'path'
const __dirname = path.resolve('./');


const writeWinnerToLog = async (iteration: any, winnerPeerId: any, solutionNumber: any) => {

    let timestamp = new Date().toLocaleString("de-DE", { timeZone: "Europe/Berlin" })

    class CsvFile {
        headers: any;
        path: any;
        writeOpts: any;
        static write(filestream: any, rows: any, options: any) {
            return new Promise((res, rej) => {
                csv.writeToStream(filestream, rows, options)
                    .on('error', (err: any) => rej(err))
                    // @ts-expect-error ts-migrate(2794) FIXME: Expected 1 arguments, but got 0. Did you forget to... Remove this comment to see the full error message
                    .on('finish', () => res());
            });
        }

        constructor(opts: any) {
            this.headers = opts.headers;
            this.path = opts.path;
            this.writeOpts = { headers: this.headers, includeEndRowDelimiter: true };
        }

        create(rows: any) {
            return CsvFile.write(fs.createWriteStream(this.path), rows, { ...this.writeOpts });
        }

        append(rows: any) {
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
        // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'string | undefined' is not assig... Remove this comment to see the full error message
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
export default writeWinnerToLog;

