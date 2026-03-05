const { RsyncTransfer } = require('../../src/sync/rsync')
const { getProjectFromCwd, getEnvironment } = require('../../src/config/store')
const runCommand = require('../../src/runCommand')

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
    const project = getProjectFromCwd()

    // Use new config system if available
    if (project) {
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
      return
    }

    // Fallback: use old shell scripts
    const items = argv.item === 'all' ? ['themes', 'plugins', 'uploads'] : [argv.item]
    for (const item of items) {
      let command
      if (item === 'themes') command = 'bin/files-pull-themes.sh'
      if (item === 'uploads') command = 'bin/files-pull.sh'
      if (item === 'plugins') command = 'bin/files-pull-plugins.sh'
      try {
        await runCommand(command, [argv.target])
      } catch (error) {
        console.error('Error running command:', error)
      }
    }
  }
}
