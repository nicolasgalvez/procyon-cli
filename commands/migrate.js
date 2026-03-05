const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')
const { prompt } = require('enquirer')
const { saveProject, saveLink } = require('../src/config/store')

module.exports = {
  command: 'migrate',
  describe: 'Import configuration from existing .env file',
  builder: {
    env: {
      default: '.env',
      describe: 'Path to .env file'
    }
  },
  handler: async (argv) => {
    const envPath = path.resolve(argv.env)

    if (!fs.existsSync(envPath)) {
      console.error(`No .env file found at ${envPath}`)
      process.exit(1)
    }

    const envConfig = dotenv.parse(fs.readFileSync(envPath))

    console.log('\nFound .env file with:')
    Object.entries(envConfig).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`)
    })

    const { confirm } = await prompt({
      type: 'confirm',
      name: 'confirm',
      message: 'Import this configuration?'
    })

    if (!confirm) {
      console.log('Migration cancelled.')
      return
    }

    const { projectName } = await prompt({
      type: 'input',
      name: 'projectName',
      message: 'Project name:',
      initial: envConfig.SITE_NAME || path.basename(process.cwd())
    })

    console.log('\nParsing SSH strings...')

    const config = {
      name: projectName,
      localPath: envConfig.LOCAL_PATH,
      wpCli: envConfig.LOCAL_DOMAIN?.includes('lndo') ? 'lando wp' : 'wp',
      environments: {}
    }

    if (envConfig.STAGING_SSH) {
      config.environments.staging = parseSSHString(envConfig.STAGING_SSH)
      config.environments.staging.path = envConfig.STAGING_PATH
      const s = config.environments.staging
      console.log(`  staging: ${envConfig.STAGING_SSH} -> host: ${s.host}, user: ${s.user}, port: ${s.port}`)
    }

    if (envConfig.LIVE_SSH) {
      config.environments.live = parseSSHString(envConfig.LIVE_SSH)
      config.environments.live.path = envConfig.LIVE_PATH
      const l = config.environments.live
      console.log(`  live: ${envConfig.LIVE_SSH} -> host: ${l.host}, user: ${l.user}, port: ${l.port}`)
    }

    const configPath = saveProject(projectName, config)
    saveLink(projectName)

    console.log(`\nCreated ${configPath}`)
    console.log('Created .procyon in current directory')

    const { deleteEnv } = await prompt({
      type: 'confirm',
      name: 'deleteEnv',
      message: 'Delete old .env file?',
      initial: false
    })

    if (deleteEnv) {
      fs.unlinkSync(envPath)
      console.log('Deleted .env')
    } else {
      console.log('  (keeping .env as backup)')
    }

    console.log('\nMigration complete!')
  }
}

function parseSSHString (sshString) {
  let user, host
  let port = 22

  if (sshString.includes('@')) {
    const [userPart, hostPart] = sshString.split('@')
    user = userPart

    if (hostPart.includes(':')) {
      [host, port] = hostPart.split(':')
      port = parseInt(port)
    } else {
      host = hostPart
    }
  } else {
    host = sshString
    user = process.env.USER
  }

  return { host, user, port }
}
