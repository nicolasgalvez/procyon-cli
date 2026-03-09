const fs = require('fs')
const path = require('path')
const os = require('os')
const SSHConfig = require('ssh-config')

/**
 * Look up a host in ~/.ssh/config and return the computed config.
 * Returns null if no config file or no matching host.
 */
function lookupSshHost (host, configPath) {
  if (!configPath) configPath = path.join(os.homedir(), '.ssh', 'config')
  if (!fs.existsSync(configPath)) return null

  const config = SSHConfig.parse(fs.readFileSync(configPath, 'utf8'))
  const computed = config.compute(host)

  // If no Hostname was resolved, the host wasn't explicitly defined
  if (!computed.Hostname) return null

  return {
    hostname: computed.Hostname || null,
    user: computed.User || null,
    port: computed.Port ? parseInt(computed.Port) : null,
    identityFile: Array.isArray(computed.IdentityFile)
      ? computed.IdentityFile[0]
      : computed.IdentityFile || null
  }
}

module.exports = { lookupSshHost }
