
const Core = require('./core');


(async function start() {

    let inputFiles = await Core.getInputFiles();
    let allPackages = [];
    let containerName = await Core.askQuestion('Enter Container Name: ');
    for (let file of inputFiles) {
        allPackages = allPackages.concat(await Core.readRequirementsTxt(file))
    }

    //make unique and sort
    allPackages = [... new Set(allPackages)].sort();


    let packageGroundTruths = await Core.readGroundTruth('./groundTruth.csv');

    let notFoundPackages = [];

    let outputCsv = [];
    allPackages.forEach(package => {

        let groundTruth = packageGroundTruths[package]

        if (!groundTruth) {
            notFoundPackages.push(package);
            return;
        }

        outputCsv.push([
            groundTruth.displayName,//Third-Party Product Name
            containerName,//Used In
            groundTruth.licenseType,//License Type
            groundTruth.urlToLicense,//URL to License
        ])
    })

    if (notFoundPackages.length) {
        console.error(`${notFoundPackages.length} packages were not found. Please add them to ground truth`);
        notFoundPackages.forEach(v => console.error(v));
        process.exit(1);
    }

    await Core.writeToCsvAsArray(outputCsv, 'output.csv');

})()
    .then(v => console.log('all done. see output.csv'))
    .catch(err => {
        console.error('Error while running');
        console.error(err);
        process.exit(1);
    })