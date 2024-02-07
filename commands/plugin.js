const fs = require('fs')
const csv = require('csv-parser')
const { execSync } = require('child_process')

// Function to execute WP-CLI command
function installPlugin (name, version, isActive) {
  let command = `wp --ssh="${process.env.REMOTE_SSH}" --path="${process.env.REMOTE_PATH}" plugin install "${name}" --version="${version}"`
  if (isActive) {
    command += ' --activate'
  }

  try {
    const output = execSync(command, { stdio: 'pipe' }).toString()
    if (output.includes('Success')) {
      return `Success,${name},${version}`
    } else {
      return `Unknown,${name},${version}`
    }
  } catch (error) {
    return `Error,${name},${version}`
  }
}

// Main function to process the CSV file
function processCSV (filePath) {
  const results = []

  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (row) => {
      if (row.name && row.name !== 'name') {
        const version = row.version.replace(/\r/g, '') // Remove carriage returns
        const status = installPlugin(row.name, version, row.status === 'active')
        results.push(status)
      }
    })
    .on('end', () => {
      console.log('status,name,version,message')
      results.forEach(result => console.log(result))
    })
}

module.exports = {
  command: 'plugin-install <target> [csv]',
  describe: 'Install and activate plugins on a server from a CSV file',
  builder: {
    server: {
    },
    csv: {
      default: 'plugins.csv',
      require: false
    }
  },
  handler: (argv) => {
    processCSV(argv.csv)
  }
}
