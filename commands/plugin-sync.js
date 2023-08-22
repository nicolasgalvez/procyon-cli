const { spawn } = require('child_process')
const { join } = require('path')

module.exports = {
  command: 'plugin-sync',
  describe: 'Add plugins found locally to composer',
  builder: {},
  handler: (argv) => {
    console.log(process.env.SITE_NAME) // This is available because of the loadEnvMiddleware

    const command = join(__dirname, '..', 'bin', 'composer-sync-plugins.sh')

    const child = spawn(command, {
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
