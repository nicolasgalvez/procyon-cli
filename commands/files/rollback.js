const { RsyncTransfer } = require('../../src/sync/rsync')
const { getProjectFromCwd, getEnvironment } = require('../../src/config/store')
const { listBackups, getBackupPath } = require('../../src/sync/backup')
const { prompt } = require('enquirer')

module.exports = {
  command: 'rollback <target> <item>',
  describe: 'Rollback a previous push from a backup.',
  builder: {
    target: {
      demandOption: true
    },
    item: {
      demandOption: true,
      choices: ['themes', 'plugins', 'uploads']
    },
    list: {
      type: 'boolean',
      describe: 'List available backups',
      default: false
    },
    to: {
      type: 'string',
      describe: 'Timestamp of the backup to restore'
    }
  },
  handler: async (argv) => {
    const project = getProjectFromCwd()
    if (!project) {
      console.error('No .procyon project found. Rollback requires the new config system.')
      console.error('Run `procyon init` or `procyon migrate` first.')
      process.exit(1)
    }

    const env = getEnvironment(project, argv.target)
    if (!env) {
      console.error(`Environment "${argv.target}" not found.`)
      process.exit(1)
    }

    const backups = listBackups(project.name, argv.target, argv.item)

    if (argv.list || !argv.to) {
      if (backups.length === 0) {
        console.log(`No backups found for ${argv.item} on ${argv.target}.`)
        return
      }

      console.log(`\nAvailable backups for ${argv.item} on ${argv.target}:\n`)
      for (const backup of backups) {
        console.log(`  ${backup}`)
      }
      console.log('\nUse --to <timestamp> to restore a backup.')
      return
    }

    const backupDir = getBackupPath(project.name, argv.target, argv.item, argv.to)
    if (!backupDir) {
      console.error(`Backup "${argv.to}" not found.`)
      console.error('Use --list to see available backups.')
      process.exit(1)
    }

    const { confirm } = await prompt({
      type: 'confirm',
      name: 'confirm',
      message: `Restore ${argv.item} on ${argv.target} from backup ${argv.to}?`
    })

    if (!confirm) return

    // Push the backup dir contents to remote
    const backupProject = { ...project, localPath: backupDir }
    const rsync = new RsyncTransfer(backupProject, env)
    const subpath = `wp-content/${argv.item}`

    console.log(`Restoring ${argv.item} from backup...`)
    await rsync.push(argv.item, subpath, { delete: true })
    console.log('Rollback complete.')
  }
}
