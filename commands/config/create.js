const fs = require('fs');
const { prompt } = require('enquirer');
const Handlebars = require('handlebars');
const path = require('path');
const yargs = require('yargs');

const template = `
{
  "projectName": "{{projectName}}",
  "localWP": "{{localWP}}",
  "inventory": {
    "environments": [
      {{#each environments}}
      {
        "name": "{{this.name}}",
        "ssh": "{{this.ssh}}",
        "path": "{{this.path}}"
      }{{#unless @last}},{{/unless}}
      {{/each}}
    ]
  }
}`;

module.exports = {
    command: 'create [outputFile]',
    describe: 'Generate a project configuration file',
    builder: {
        outputFile: {
            describe: 'Path to the output file',
            type: 'string',
            default: 'config/procyon-config.json'
        }
    },
    handler: async (argv) => {
        const response = await prompt([
            {
                type: 'input',
                name: 'projectName',
                message: 'Enter the project name:'
            },
            {
                type: 'input',
                name: 'localWP',
                message: 'Do you use vanilla wp cli or lando wp?:',
                initial: 'lando',
                choices: ['wp', 'lando wp']
            }
        ]);

        const environments = [];

        while (true) {
            const environmentResponse = await prompt([
                {
                    type: 'input',
                    name: 'name',
                    message: 'Enter the environment name (or "q" to quit):'
                }
            ]);

            const environmentName = environmentResponse.name.trim();

            if (environmentName.toLowerCase() === 'q') {
                break;
            }

            const environment = await prompt([
                {
                    type: 'input',
                    name: 'ssh',
                    message: `Enter the SSH value for environment ${environmentName}:`
                },
                {
                    type: 'input',
                    name: 'path',
                    message: `Enter the path value for environment ${environmentName}:`,
                    initial: 'public'
                }
            ]);

            environments.push({ name: environmentName, ...environment });
        }

        const compiledTemplate = Handlebars.compile(template);
        const generatedContent = compiledTemplate({ projectName: response.projectName, environments });

        const outputFilePath = path.resolve(argv.outputFile);

        fs.writeFileSync(outputFilePath, generatedContent);

        console.log(`Configuration file generated successfully at ${outputFilePath}`);
    }
};

yargs.command(module.exports).argv;
