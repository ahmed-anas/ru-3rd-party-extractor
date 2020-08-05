var LineReader = require('line-reader');

const createCsvWriter = require('csv-writer').createArrayCsvWriter;
const readline = require("readline");
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
const Fs = require('fs');
const CsvReadableStream = require('csv-reader');



module.exports = {

    askQuestion(question) {
        return new Promise(resolve => {
            rl.question(question, v => resolve(v))
        })
    },

    writeToCsvAsArray(arr, outputPath) {
        const csvWriter = createCsvWriter({
            header: ['Third-Party Product Name', 'Used In', 'License Type', 'URL to License'],
            path: outputPath
        });

        return csvWriter.writeRecords(arr);
    },

    getInputFiles: async function () {

        let inputFiles = [];

        for (let newInput; !!(newInput = await this.getInputPath()).trim();) {
            inputFiles.push(newInput);
        }
        return inputFiles;
    },
    getInputPath: () => {
        return new Promise(resolve => {
            rl.question('Enter requirements.txt path or press enter if there are no more requirement.txts: ', v => resolve(v))
        })
    },

    readRequirementsTxt: (path) => {
        return new Promise((resolve, reject) => {

            let lines = []
            LineReader.eachLine(path, function (line) {
                let splitLine = line.split('==');
                if (splitLine.length !== 2) {
                    let errText = `could parse ${line} for package name. Splitting on '==', lenght was ${splitLine.length}. `;
                    reject(errText);
                    throw new Error(errText)
                }

                lines.push(splitLine[0].toLocaleLowerCase());
            }, function (err) {
                if (err) return reject(err);
                resolve(lines);
            });
        })

    },

    readGroundTruth(path) {
        return new Promise((resolve, reject) => {
            let inputStream = Fs.createReadStream(path, { encoding: 'utf8' });

            let groundTruthHash = {};
            inputStream
                .pipe(new CsvReadableStream({ parseNumbers: false, parseBooleans: false, trim: true, skipEmptyLines: true, asObject: true, skipHeader: true }))
                .on('data', function (row) {
                    groundTruthHash[row.packageName] = row;
                })
                .on('end', function () {
                    resolve(groundTruthHash);
                })
                .on('error', function (err) {
                    return reject(err);
                })
        })
    },



}