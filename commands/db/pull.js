const { spawn } = require('child_process')

module.exports = {
  command: 'pull <target> [--remote-url] [--local-url]',
  describe: 'Pull database from a target environment',
  builder: {
    target: {
      demandOption: true
    },
    'remote-url': {
      default: 'public'
    },
    'local-url': {
      default: 'public'
    }
  },
  handler: (argv) => {
    console.log(process.env.SITE_NAME) // This is available because of the loadEnvMiddleware

    let command = `${__dirname}/../../bin/db-pull.sh`

    let child = spawn(command, [argv.target], {
      stdio: 'inherit'
    })

    child.on('error', (error) => {
      console.log(`error: ${error.message}`)
    })

    child.on('close', (code) => {
      if (code !== 0) {
        console.log(`Process exited with code ${code}`)
      }
    })
  }
}
