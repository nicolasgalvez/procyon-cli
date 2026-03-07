const path = require('path')
const fs = require('fs')
const { paths } = require('../config/store')

function getBackupDir (projectName, envName, item) {
  return path.join(paths.procyonDir, 'backups', projectName, envName, item)
}

function getTimestamp () {
  return new Date().toISOString().replace(/[:.]/g, '-')
}

/**
 * Create a backup of the remote state before pushing
 */
async function createBackup (rsync, project, envName, item, itemName) {
  const timestamp = getTimestamp()
  const subpath = itemName
    ? `wp-content/${item}/${itemName}`
    : `wp-content/${item}`

  const backupDir = path.join(getBackupDir(project.name, envName, item), timestamp)
  fs.mkdirSync(backupDir, { recursive: true })

  console.log(`Backing up remote ${item} to ${backupDir}...`)

  const backupProject = { ...project, localPath: backupDir }
  const { RsyncTransfer } = require('./rsync')
  const backupRsync = new RsyncTransfer(backupProject, rsync.env)

  await backupRsync.pull(subpath, item)

  console.log('Backup complete.')
  return { timestamp, path: backupDir }
}

/**
 * List available backups for a project/env/item
 */
function listBackups (projectName, envName, item) {
  const dir = getBackupDir(projectName, envName, item)
  if (!fs.existsSync(dir)) return []

  return fs.readdirSync(dir)
    .filter(f => fs.statSync(path.join(dir, f)).isDirectory())
    .sort()
    .reverse()
}

/**
 * Get the path to a specific backup
 */
function getBackupPath (projectName, envName, item, timestamp) {
  const backupDir = path.join(getBackupDir(projectName, envName, item), timestamp)
  if (!fs.existsSync(backupDir)) return null
  return backupDir
}

module.exports = { createBackup, listBackups, getBackupPath }
