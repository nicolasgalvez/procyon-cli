const { spawn } = require('child_process')
const os = require('os')
const path = require('path')
const fs = require('fs')

const DEFAULT_EXCLUDE_FILE = path.join(__dirname, '../../bin/rsync-exclude')

class RsyncTransfer {
  constructor (project, environment) {
    this.project = project
    this.env = environment
  }

  buildSshCommand () {
    const { port, identityFile } = this.env
    let ssh = `ssh -p ${port || 22}`
    if (identityFile) {
      ssh += ` -i ${identityFile.replace('~', os.homedir())}`
    }
    return ssh
  }

  buildRemote (subpath) {
    const { user, host, path: remotePath } = this.env
    const full = subpath ? `${remotePath}/${subpath}` : remotePath
    return `${user}@${host}:${full}`
  }

  buildLocal (subpath) {
    return subpath
      ? path.join(this.project.localPath, subpath)
      : this.project.localPath
  }

  buildExcludeArgs () {
    const excludeFile = this.project.excludeFile || DEFAULT_EXCLUDE_FILE
    if (fs.existsSync(excludeFile)) {
      return ['--exclude-from', excludeFile]
    }
    // Fall back to inline excludes from project config
    const excludes = this.project.exclude || []
    return excludes.flatMap(pattern => ['--exclude', pattern])
  }

  /**
   * Pull files from remote to local
   */
  async pull (remoteSub, localSub, options = {}) {
    const args = [
      '-chavzP',
      '--stats',
      '-e', this.buildSshCommand(),
      ...this.buildExcludeArgs()
    ]

    if (options.dryRun) args.push('--dry-run', '--itemize-changes')
    if (options.delete) args.push('--delete-after')

    // Ensure trailing slash for directory sync
    const remote = ensureTrailingSlash(this.buildRemote(remoteSub))
    const local = ensureTrailingSlash(this.buildLocal(localSub))

    // Ensure local directory exists
    fs.mkdirSync(local.replace(/\/$/, ''), { recursive: true })

    args.push(remote, local)

    return this.exec(args, options)
  }

  /**
   * Push files from local to remote
   */
  async push (localSub, remoteSub, options = {}) {
    const args = [
      '-chavzP',
      '--stats',
      '-e', this.buildSshCommand(),
      ...this.buildExcludeArgs()
    ]

    if (options.dryRun) args.push('--dry-run', '--itemize-changes')
    if (options.delete) args.push('--delete-after')

    const local = ensureTrailingSlash(this.buildLocal(localSub))
    const remote = ensureTrailingSlash(this.buildRemote(remoteSub))

    args.push(local, remote)

    return this.exec(args, options)
  }

  /**
   * Run rsync with --dry-run --itemize-changes and parse the output
   */
  async dryRun (localSub, remoteSub, options = {}) {
    const args = [
      '-chavzP',
      '--dry-run',
      '--itemize-changes',
      '-e', this.buildSshCommand(),
      ...this.buildExcludeArgs()
    ]

    if (options.delete) args.push('--delete-after')

    const local = ensureTrailingSlash(this.buildLocal(localSub))
    const remote = ensureTrailingSlash(this.buildRemote(remoteSub))

    args.push(local, remote)

    return new Promise((resolve, reject) => {
      const child = spawn('rsync', args, { stdio: ['inherit', 'pipe', 'inherit'] })
      let output = ''

      child.stdout.on('data', (data) => {
        output += data.toString()
      })

      child.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`rsync exited with code ${code}`))
          return
        }
        resolve(parseItemizedChanges(output))
      })

      child.on('error', reject)
    })
  }

  /**
   * Run an SSH command on the remote
   */
  async ssh (command) {
    const { user, host, port } = this.env
    const args = ['-p', String(port || 22), `${user}@${host}`, '-C', command]

    return new Promise((resolve, reject) => {
      const child = spawn('ssh', args, { stdio: 'inherit' })
      child.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`SSH command exited with code ${code}`))
          return
        }
        resolve()
      })
      child.on('error', reject)
    })
  }

  exec (args, options = {}) {
    return new Promise((resolve, reject) => {
      const stdio = options.capture ? ['inherit', 'pipe', 'inherit'] : 'inherit'
      const child = spawn('rsync', args, { stdio })
      let output = ''

      if (options.capture && child.stdout) {
        child.stdout.on('data', (data) => {
          output += data.toString()
        })
      }

      child.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`rsync exited with code ${code}`))
          return
        }
        resolve(options.capture ? output : undefined)
      })

      child.on('error', reject)
    })
  }
}

function ensureTrailingSlash (p) {
  return p.endsWith('/') ? p : p + '/'
}

/**
 * Parse rsync --itemize-changes output into structured changes
 */
function parseItemizedChanges (output) {
  const added = []
  const modified = []
  const deleted = []

  for (const line of output.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('sent') || trimmed.startsWith('total')) continue

    if (trimmed.startsWith('*deleting')) {
      deleted.push(trimmed.replace('*deleting   ', ''))
    } else if (trimmed.startsWith('>f+++')) {
      added.push(trimmed.substring(12).trim())
    } else if (trimmed.startsWith('>f')) {
      modified.push(trimmed.substring(12).trim())
    } else if (trimmed.startsWith('cd+++')) {
      added.push(trimmed.substring(12).trim())
    }
  }

  return { added, modified, deleted }
}

module.exports = { RsyncTransfer, parseItemizedChanges }
