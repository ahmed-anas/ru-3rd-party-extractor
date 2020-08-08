
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const Fs = require('fs');
const Path = require('path');

const prBodyFileName = 'tempPRBody.txt';

const JsYaml = require('js-yaml');

function executeAndLogWithDefault(_defaults) {
    let defaults = _defaults;
    return async function (cmd, _options = {}) {
        let options = Object.assign({}, defaults, _options);
        let response = await exec(cmd, options);
        response.stdout && console.log(response.stdout);
        response.stderr && console.error(response.stderr);
    }
}

function getRepo(issueTitle) {
    return issueTitle.replace('Describe', '').replace('in the architecture document', '').trim();
}
module.exports = {

    createPullRequestString: async (issueKey, issueTitle) => {
        let githubRepo = getRepo(issueTitle);
        return `${issueKey}: ${issueTitle}


        ### Jira Ticket [${issueKey}](https://crossover.atlassian.net/browse/${issueKey})
### Jira Ticket Title
${issueTitle}

### Github Service Repo 
https://github.com/trilogy-group/${githubRepo}

### Document Link

- [Functional Overview]()
- [Component Diagram]()
- [3rd Party Softwares]()
- [System API]()
- [Data View]()
        `
    },

    pushChanges: async function (cwd, issueKey, issueTitle) {
        const executor = executeAndLogWithDefault({ cwd });
        const branchName = `feature/${issueKey}`;


        const json = require(this.diagramJsonPath(cwd));
        let x = JsYaml.dump(json, { indent: 4 });
        Fs.writeFileSync(this.diagramYamlPath(cwd), x);


        let prString = await this.createPullRequestString(issueKey, issueTitle);

        Fs.writeFileSync(prBodyFileName, prString);

        let pathToBody = Path.join(__dirname, prBodyFileName)
        await executor(`git checkout ${branchName}`)

        // await executor(`json2yaml C4diagrams.json > C4diagrams.yaml`);
        await executor(`git add C4diagrams.yaml`);
        await executor(`git commit -m "updated C4 Model "`);
        await executor(`git add api.yaml`);
        await executor(`git commit -m "updated api"`).catch(err => console.error(err.message));
        await executor(`git push`);

        await executor(`hub pull-request -F ${pathToBody} -o -p`).catch(err => console.error(err.message));

        Fs.unlinkSync(prBodyFileName);
    },

    diagramYamlPath: function (root) {
        return Path.join(root, 'C4diagrams.yaml')
    },
    diagramJsonPath: function (root) {
        return Path.join(root, 'C4diagrams.json')

    },
    setupNewBranch: async function (cwd, issueKey, issueTitle) {
        const executor = executeAndLogWithDefault({ cwd });
        const branchName = `feature/${issueKey}`;


        await exec(`git clone https://github.com/trilogy-group/${getRepo(issueTitle)}`, { cwd: "../" })

        await executor('git checkout master')
        await executor('git pull')
        await executor(`git checkout -b ${branchName}`).catch(() => { })
        await executor(`git push --set-upstream origin "${branchName}"`);

        const yaml = Fs.readFileSync(this.diagramYamlPath(cwd));
        let json = JsYaml.load(yaml)
        Fs.writeFileSync(this.diagramJsonPath(cwd), JSON.stringify(json));

        // const json = require(this.diagramJsonPath(cwd));
        // let x= JsYaml.dump(json, { indent: 4 });
        // Fs.writeFileSync(this.diagramYamlPath(cwd), x);


    }
}