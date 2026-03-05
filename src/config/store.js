const os = require('os')
const path = require('path')
const fs = require('fs')
const { validateProject, validateLink } = require('./schema')

const paths = {
  procyonDir: path.join(os.homedir(), '.procyon'),
  projectsDir: path.join(os.homedir(), '.procyon', 'projects')
}
const LINK_FILE = '.procyon'

function ensureConfigDir () {
  if (!fs.existsSync(paths.projectsDir)) {
    fs.mkdirSync(paths.projectsDir, { recursive: true })
  }
}

function getProject (name) {
  const filePath = path.join(paths.projectsDir, `${name}.json`)
  if (!fs.existsSync(filePath)) {
    return null
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function saveProject (name, config) {
  ensureConfigDir()
  const result = validateProject(config)
  if (!result.valid) {
    throw new Error(`Invalid config: ${result.errors.join(', ')}`)
  }
  const filePath = path.join(paths.projectsDir, `${name}.json`)
  fs.writeFileSync(filePath, JSON.stringify(config, null, 2))
  return filePath
}

function listProjects () {
  ensureConfigDir()
  const files = fs.readdirSync(paths.projectsDir).filter(f => f.endsWith('.json'))
  return files.map(f => {
    const config = JSON.parse(fs.readFileSync(path.join(paths.projectsDir, f), 'utf8'))
    return { name: path.basename(f, '.json'), config }
  })
}

function removeProject (name) {
  const filePath = path.join(paths.projectsDir, `${name}.json`)
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
    return true
  }
  return false
}

function getProjectFromCwd (cwd) {
  const linkPath = path.join(cwd || process.cwd(), LINK_FILE)
  if (!fs.existsSync(linkPath)) {
    return null
  }
  const link = JSON.parse(fs.readFileSync(linkPath, 'utf8'))
  const result = validateLink(link)
  if (!result.valid) {
    throw new Error(`Invalid .procyon link: ${result.errors.join(', ')}`)
  }
  return getProject(link.project)
}

function saveLink (projectName, dir) {
  const linkPath = path.join(dir || process.cwd(), LINK_FILE)
  fs.writeFileSync(linkPath, JSON.stringify({ project: projectName }, null, 2) + '\n')
}

function getEnvironment (projectName, envName) {
  const project = typeof projectName === 'string' ? getProject(projectName) : projectName
  if (!project) return null
  return project.environments[envName] || null
}

/**
 * Populate process.env with values from the new config format.
 * This bridges the gap so existing shell scripts still work.
 */
function toEnv (project, envName) {
  process.env.SITE_NAME = project.name
  process.env.LOCAL_PATH = project.localPath
  process.env.WP = project.wpCli || 'wp'
  process.env.STACK = project.wpCli === 'lando wp' ? 'lando' : 'localwp'

  const env = project.environments[envName]
  if (env) {
    process.env.TARGET_ENV = envName
    process.env.REMOTE_SSH = `${env.user}@${env.host}`
    process.env.REMOTE_DOMAIN = `${env.user}@${env.host}`
    process.env.REMOTE_PATH = env.path
  }

  // Also set per-environment vars for compatibility
  for (const [name, cfg] of Object.entries(project.environments)) {
    const prefix = name.toUpperCase()
    process.env[`${prefix}_SSH`] = `${cfg.user}@${cfg.host}`
    process.env[`${prefix}_DOMAIN`] = `${cfg.user}@${cfg.host}`
    process.env[`${prefix}_PATH`] = cfg.path
  }
}

module.exports = {
  paths,
  ensureConfigDir,
  getProject,
  saveProject,
  listProjects,
  removeProject,
  getProjectFromCwd,
  saveLink,
  getEnvironment,
  toEnv
}
