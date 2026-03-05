const { RsyncTransfer } = require('../../src/sync/rsync')
const { getProjectFromCwd, getEnvironment } = require('../../src/config/store')
const { createBackup } = require('../../src/sync/backup')
const { prompt } = require('enquirer')
const runCommand = require('../../src/runCommand')

const ITEM_PATHS = {
  themes: 'wp-content/themes',
  plugins: 'wp-content/plugins',
  uploads: 'wp-content/uploads'
}

module.exports = {
  command: 'push <target> [item] [--name]',
  describe: 'Push uploads, themes, or plugins to an environment.',
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
      describe: 'Push a single theme or plugin by name'
    },
    'dry-run': {
      type: 'boolean',
      describe: 'Preview changes without transferring',
      default: false
    },
    force: {
      type: 'boolean',
      describe: 'Skip confirmation prompt',
      default: false
    },
    'no-backup': {
      type: 'boolean',
      describe: 'Skip pre-push backup',
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

        // Show diff preview before pushing (unless --force or --dry-run)
        if (!argv.force && !argv.dryRun) {
          console.log(`\nPreviewing changes for ${item}${argv.name ? ` (${argv.name})` : ''}...`)
          try {
            const changes = await rsync.dryRun(subpath, subpath, {
              delete: item !== 'uploads'
            })

            if (changes.added.length === 0 && changes.modified.length === 0 && changes.deleted.length === 0) {
              console.log('No changes to push.')
              continue
            }

            displayDiff(changes)

            const { confirm } = await prompt({
              type: 'confirm',
              name: 'confirm',
              message: 'Proceed with push?'
            })

            if (!confirm) {
              console.log('Skipped.')
              continue
            }
          } catch (error) {
            console.error(`Error generating preview: ${error.message}`)
            console.error('Continuing without preview...')
          }
        }

        // Backup before pushing (unless --no-backup or --dry-run)
        if (!argv.noBackup && !argv.dryRun) {
          try {
            await createBackup(rsync, project, argv.target, item, argv.name)
          } catch (error) {
            console.error(`Backup failed: ${error.message}`)
            const { proceed } = await prompt({
              type: 'confirm',
              name: 'proceed',
              message: 'Backup failed. Continue without backup?',
              initial: false
            })
            if (!proceed) continue
          }
        }

        console.log(`Pushing ${item}${argv.name ? ` (${argv.name})` : ''}...`)

        try {
          await rsync.push(subpath, subpath, {
            dryRun: argv.dryRun,
            delete: item !== 'uploads'
          })
        } catch (error) {
          console.error(`Error pushing ${item}:`, error.message)
        }
      }
      return
    }

    // Fallback: use old shell scripts
    const items = argv.item === 'all' ? ['themes', 'plugins', 'uploads'] : [argv.item]
    for (const item of items) {
      const options = [argv.target]
      let command = ''

      if (item === 'themes') command = 'bin/files-push-themes.sh'
      if (item === 'uploads') command = 'bin/files-push.sh'
      if (item === 'plugins') {
        command = 'bin/files-push-plugins.sh'
        if (argv.name) {
          options.push('--single=' + argv.name)
        }
      }

      try {
        await runCommand(command, options)
      } catch (error) {
        console.error('Error running command:', error)
      }
    }
  }
}

function displayDiff (changes) {
  console.log('\nChanges to be pushed:\n')

  for (const f of changes.added) console.log(`  + ${f}`)
  for (const f of changes.modified) console.log(`  M ${f}`)
  for (const f of changes.deleted) console.log(`  - ${f}`)

  console.log(`\n${changes.added.length} added, ${changes.modified.length} modified, ${changes.deleted.length} deleted`)
}
