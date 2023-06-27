const fs = require('fs')
const path = require('path')
const Handlebars = require('handlebars')
const { prompt } = require('enquirer')

module.exports = {
  command: 'template <templateFile> <outputFile>',
  describe: 'Generate a file based on a Handlebars template. Pipe JSON into the command to use it as variable values.',
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
    const templateFilePath = path.resolve(argv.templateFile)
    const outputFilePath = path.resolve(argv.outputFile)

    try {
      // Read the template file
      const templateContent = fs.readFileSync(templateFilePath, 'utf8')

      // Compile the Handlebars template
      const template = Handlebars.compile(templateContent)

      // Get the variable names from the template
      const variableNames = getVariableNames(templateContent)

      // Check if input is piped and parse the JSON
      const isPipedInput = !process.stdin.isTTY
      const pipedInput = isPipedInput ? await getPipedInput() : {}

      // Prompt the user for missing variable values
      const variableValues = await promptVariableValues(variableNames, pipedInput)

      // Merge the variable values from piped input with prompted values
      const mergedValues = { ...pipedInput, ...variableValues }

      // Generate the content based on the template and variable values
      const generatedContent = template(mergedValues)

      // Write the generated content to the output file
      fs.writeFileSync(outputFilePath, generatedContent)

      console.log(`File generated successfully at ${outputFilePath}`)
    } catch (error) {
      console.error('Error generating file:', error)
    }
  }
}

function getVariableNames (template) {
  const variables = []
  const regex = /{{\s*([A-Za-z0-9_]+)\s*}}/g
  let match

  while ((match = regex.exec(template)) !== null) {
    variables.push(match[1])
  }

  return variables
}

async function promptVariableValues (variableNames, pipedInput) {
  const missingVariables = variableNames.filter(name => !(name in pipedInput))
  const answers = await prompt(
    missingVariables.map(variableName => ({
      type: 'input',
      name: variableName,
      message: `Enter value for "${variableName}":`
    }))
  )

  return answers
}

function getPipedInput () {
  return new Promise((resolve, reject) => {
    let inputData = ''

    process.stdin
      .on('data', chunk => {
        inputData += chunk.toString()
      })
      .on('end', () => {
        try {
          const parsedData = JSON.parse(inputData)
          resolve(parsedData)
        } catch (error) {
          reject(error)
        }
      })
      .on('error', reject)
  })
}
