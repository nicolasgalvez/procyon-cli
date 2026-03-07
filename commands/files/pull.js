const { RsyncTransfer } = require('../../src/sync/rsync')
const { getEnvironment } = require('../../src/config/store')

const ITEM_PATHS = {
  themes: 'wp-content/themes',
  plugins: 'wp-content/plugins',
  uploads: 'wp-content/uploads'
}

module.exports = {
  command: 'pull <target> [item] [--name]',
  describe: 'Pull uploads, themes, or plugins from an environment.',
  builder: {
    target: {
      demandOption: true
    },
    item: {
      default: 'uploads',
      choices: ['themes', 'plugins', 'uploads', 'all']
    },
    name: {
      type: 'string',
      describe: 'Pull a single theme or plugin by name'
    },
    'dry-run': {
      type: 'boolean',
      describe: 'Preview changes without transferring',
      default: false
    }
  },
  handler: async (argv) => {
    const project = argv.project
    const env = getEnvironment(project, argv.target)
    if (!env) {
      console.error(`Environment "${argv.target}" not found in project config.`)
      process.exit(1)
    }

    const rsync = new RsyncTransfer(project, env)
    const items = argv.item === 'all' ? ['themes', 'plugins', 'uploads'] : [argv.item]

    for (const item of items) {
      let subpath = ITEM_PATHS[item]
      if (argv.name) {
        subpath = `${subpath}/${argv.name}`
      }

      console.log(`Pulling ${item}${argv.name ? ` (${argv.name})` : ''}...`)

      try {
        await rsync.pull(subpath, subpath, {
          dryRun: argv.dryRun,
          delete: item !== 'uploads'
        })
      } catch (error) {
        console.error(`Error pulling ${item}:`, error.message)
      }
    }
  }
}
