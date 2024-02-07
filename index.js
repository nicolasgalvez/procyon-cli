#!/usr/bin/env node
const yargs = require('yargs/yargs')
const dotenv = require('dotenv')
const path = require('path')
const fs = require('fs')
// const { join } = require('path')

/**
 * Log a message if verbose logging is enabled
 * @param message
 */
const log = (argv, message) => {
  if (argv.verbose) {
    console.log(message)
  }
}

const argv = yargs(process.argv.slice(2)) // eslint-disable-line no-unused-vars
  .scriptName('procyon')
  .option('config', {
    description: 'Path to the config file',
    default: 'config/procyon-config.json',
    alias: 'c',
    type: 'string'
  })
  .option('env', {
    description: 'Path to the .env file',
    default: './.env',
    alias: 'e',
    type: 'string'
  })
  .option('verbose', {
    alias: 'v',
    type: 'boolean',
    description: 'Run with verbose logging'
  })
  .middleware(loadEnvMiddleware) // Load the .env file and make it available in modules.
  .middleware(checkEnvKeysMiddleware) // Check required keys in .env file
  .middleware(loadConfig) // Load the config file and make it available in modules.
  .commandDir('commands') // Load commands from the `commands` directory
  .demandCommand(1, '')
  .help()
  .argv

/**
 * Load the .env file based on the provided or default path
 * @param argv
 * @returns {*}
 */
function loadEnvMiddleware (argv) {
  const envPath = path.resolve(process.cwd(), argv.env)
  if (!fs.existsSync(envPath)) {
    console.error('.env file not found at ' + envPath)
    process.exit(1)
  }
  dotenv.config({ path: envPath })

  process.env.ROOT_PATH = __dirname

  return argv
}

/**
 * Load the config file based on the provided or default path
 * @param argv
 */
function loadConfig (argv) {
  const configPath = path.resolve(process.cwd(), argv.config)
  if (fs.existsSync(configPath)) {
    log(argv, `Loading config from ${configPath}`)
    const config = require(configPath)
    argv.config = config
  } else {
    log(argv, `Config file not found at ${configPath}`)
  }

  return argv
}

/**
 * Check that all required keys are present in the .env file
 * @param argv
 * @returns {*}
 */
function checkEnvKeysMiddleware (argv) {
  const requiredKeys = [
    'SITE_NAME',
    'LIVE_DOMAIN',
    'STAGING_DOMAIN',
    'LOCAL_DOMAIN',
    'STAGING_SSH',
    'LIVE_SSH',
    'STAGING_PATH',
    'LIVE_PATH',
    'LOCAL_PATH'
  ]

  const missingKeys = requiredKeys.filter(key => !(key in process.env))

  if (missingKeys.length > 0) {
    console.error('The following environment variable(s) are missing:')
    console.error(missingKeys.join(', '))
    process.exit(1)
  }

  // Set up required keys
  // TODO: refactor to use a config file to support multiple named environments
  process.env.TARGET_ENV = argv.target
  process.env.STACK = 'localwp'
  process.env.WP = 'wp'

  // console.log(argv.target)
  if (argv.target === 'live') {
    process.env.REMOTE_SSH = process.env.LIVE_SSH
    process.env.REMOTE_DOMAIN = process.env.LIVE_DOMAIN
    process.env.REMOTE_PATH = process.env.LIVE_PATH
  }
  if (argv.target === 'staging') {
    process.env.REMOTE_SSH = process.env.STAGING_SSH
    process.env.REMOTE_DOMAIN = process.env.STAGING_DOMAIN
    process.env.REMOTE_PATH = process.env.STAGING_PATH
  }
  if (process.env.LOCAL_DOMAIN.includes('lndo')) {
    console.log('Local environment detected: Lando')
    process.env.STACK = 'lando'
    process.env.WP = 'lando wp'
  }

  return argv
}
