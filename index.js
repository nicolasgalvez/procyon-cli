#!/usr/bin/env node
const yargs = require('yargs/yargs')
const dotenv = require('dotenv')
const path = require('path')
const fs = require('fs')
const { getProjectFromCwd, toEnv } = require('./src/config/store')

const log = (argv, message) => {
  if (argv.verbose) {
    console.log(message)
  }
}

// Commands that don't need any config loaded
const CONFIG_FREE_COMMANDS = ['init', 'migrate', 'projects']

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
  .middleware(loadProjectMiddleware)
  .commandDir('commands')
  .demandCommand(1, '')
  .help()
  .argv

/**
 * Unified middleware: tries new .procyon config first, falls back to .env
 */
function loadProjectMiddleware (argv) {
  const command = argv._[0]

  // Skip config loading for setup commands
  if (CONFIG_FREE_COMMANDS.includes(command)) {
    process.env.ROOT_PATH = __dirname
    return argv
  }

  // Try new config system first
  const project = getProjectFromCwd()
  if (project) {
    log(argv, `Using project config: ${project.name}`)
    argv.project = project

    if (argv.target) {
      toEnv(project, argv.target)
    } else {
      toEnv(project)
    }

    process.env.ROOT_PATH = __dirname
    loadOptionalConfig(argv)
    return argv
  }

  // Fall back to .env
  log(argv, 'No .procyon link found, falling back to .env')
  loadEnvFallback(argv)
  checkEnvKeys(argv)
  loadOptionalConfig(argv)

  return argv
}

function loadEnvFallback (argv) {
  const envPath = path.resolve(process.cwd(), argv.env)
  if (!fs.existsSync(envPath)) {
    console.error('.env file not found at ' + envPath)
    console.error('Run `procyon init` to set up a project, or create a .env file.')
    process.exit(1)
  }
  dotenv.config({ path: envPath })
  process.env.ROOT_PATH = __dirname
}

function checkEnvKeys (argv) {
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

  process.env.TARGET_ENV = argv.target
  process.env.STACK = 'localwp'
  process.env.WP = 'wp'

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
}

function loadOptionalConfig (argv) {
  const configPath = path.resolve(process.cwd(), argv.config)
  if (fs.existsSync(configPath)) {
    log(argv, `Loading config from ${configPath}`)
    const config = require(configPath)
    argv.config = config
  }
}
