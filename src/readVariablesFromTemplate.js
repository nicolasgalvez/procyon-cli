const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');
const { prompt } = require('enquirer');

module.exports = {
    command: 'template <templateFile> <outputFile>',
    describe: 'Generate a file based on a Handlebars template',
    builder: {
        templateFile: {
            describe: 'Path to the Handlebars template file',
            type: 'string'
        },
        outputFile: {
            describe: 'Path to the output file',
            type: 'string'
        }
    },
    handler: async (argv) => {
        const templateFilePath = path.resolve(argv.templateFile);
        const outputFilePath = path.resolve(argv.outputFile);

        try {
            // Read the template file
            const templateContent = fs.readFileSync(templateFilePath, 'utf8');

            // Compile the Handlebars template
            const template = Handlebars.compile(templateContent);

            // Get the variable names from the template
            const variableNames = getVariableNames(templateContent);

            // Prompt the user for variable values
            const variableValues = await promptVariableValues(variableNames);

            // Generate the content based on the template and variable values
            const generatedContent = template(variableValues);

            // Write the generated content to the output file
            fs.writeFileSync(outputFilePath, generatedContent);

            console.log(`File generated successfully at ${outputFilePath}`);
        } catch (error) {
            console.error('Error generating file:', error);
        }
    }
};

function getVariableNames(template) {
    const variables = [];
    const regex = /{{\s*([A-Za-z0-9_]+)\s*}}/g;
    let match;

    while ((match = regex.exec(template)) !== null) {
        variables.push(match[1]);
    }

    return variables;
}

async function promptVariableValues(variableNames) {
    const answers = await prompt(
        variableNames.map(variableName => ({
            type: 'input',
            name: variableName,
            message: `Enter value for "${variableName}":`
        }))
    );

    return answers;
}
