const REQUIRED_PROJECT_FIELDS = ['name', 'localPath', 'environments']
const REQUIRED_ENV_FIELDS = ['host', 'user', 'path']

function validateProject (config) {
  const errors = []

  for (const field of REQUIRED_PROJECT_FIELDS) {
    if (!config[field]) {
      errors.push(`Missing required field: ${field}`)
    }
  }

  if (config.environments && typeof config.environments === 'object') {
    for (const [envName, env] of Object.entries(config.environments)) {
      for (const field of REQUIRED_ENV_FIELDS) {
        if (!env[field]) {
          errors.push(`Environment "${envName}" missing required field: ${field}`)
        }
      }
    }
  }

  return { valid: errors.length === 0, errors }
}

function validateLink (link) {
  if (!link.project || typeof link.project !== 'string') {
    return { valid: false, errors: ['Missing or invalid "project" field'] }
  }
  return { valid: true, errors: [] }
}

module.exports = { validateProject, validateLink }
