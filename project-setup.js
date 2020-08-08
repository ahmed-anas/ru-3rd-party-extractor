const Core = require('./core');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const GitSetup = require('./git-setup');

const cwd = "../rc-pca-module";


async function getInputs() {

    let projectKey = await Core.askQuestion('Enter project key in the format "REM-XXXX": ');
    // let projectKey = 'REM-temp2';


    let projectTitle = await Core.askQuestion('Enter jira issue title: ');
    // let projectTitle = 'tmep title';

    return { projectTitle, projectKey }
}
(async function () {


    if (process.argv[2] === "setup") {
        let { projectKey, projectTitle } = await getInputs();
        await GitSetup.setupNewBranch(cwd, projectKey, projectTitle);
    }
    else if (process.argv[2] === "deploy") {
        let { projectKey, projectTitle } = await getInputs();
        await GitSetup.pushChanges(cwd, projectKey, projectTitle);
    }
    else {
        throw new Error("first argument must be on of 'setup' or 'deploy'. Currently got: " + process.argv[2])
    }


})()
    .then(() => {
        console.log('all done');
        process.exit(0);
    }).catch(err => {
        console.error(err);
        console.error(err.message);
        process.exit(1);
    })