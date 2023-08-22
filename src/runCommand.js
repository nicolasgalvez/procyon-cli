const { spawn } = require('child_process')
const { join } = require('path')

/**
 * Run a command using spawn
 *
 * @param {string} command - The command to run.
 * @param {string[]} options - The options to use when spawning the child process.
 * @returns {Promise} - A promise that resolves when the command is done, and rejects when an error happens.
 */
function runCommand (command, options) {

  return new Promise((resolve, reject) => {
    let child = spawn(process.env.ROOT_PATH + '/' + command, options, {
      stdio: 'inherit'
    })

    child.on('error', (error) => {
      console.error(`error: ${error.message}`)
      reject(error)
    })

    child.on('close', (code) => {
      if (code !== 0) {
        console.error(`Process exited with code ${code}`)
        reject(new Error(`Process exited with code ${code}`))
      } else {
        resolve()
      }
    })
  })
}

module.exports = runCommand
