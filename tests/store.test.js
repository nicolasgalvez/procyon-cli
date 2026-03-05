import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const fs = require('fs')
const path = require('path')
const os = require('os')
const store = require('../src/config/store')

let tmpDir, origProcyonDir, origProjectsDir

describe('config store', () => {
  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'procyon-test-'))
    origProcyonDir = store.paths.procyonDir
    origProjectsDir = store.paths.projectsDir

    store.paths.procyonDir = tmpDir
    store.paths.projectsDir = path.join(tmpDir, 'projects')
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
    store.paths.procyonDir = origProcyonDir
    store.paths.projectsDir = origProjectsDir
  })

  const validConfig = {
    name: 'test-site',
    localPath: '/Users/test/Sites/test-site',
    environments: {
      staging: {
        host: 'staging.example.com',
        user: 'deploy',
        port: 22,
        path: '/var/www/html'
      }
    }
  }

  describe('saveProject / getProject', () => {
    it('saves and loads a project', () => {
      store.saveProject('test-site', validConfig)
      const loaded = store.getProject('test-site')
      expect(loaded).toEqual(validConfig)
    })

    it('returns null for non-existent project', () => {
      store.ensureConfigDir()
      expect(store.getProject('nope')).toBeNull()
    })

    it('throws on invalid config', () => {
      expect(() => store.saveProject('bad', { name: 'bad' }))
        .toThrow('Invalid config')
    })
  })

  describe('listProjects', () => {
    it('returns empty array when no projects', () => {
      expect(store.listProjects()).toEqual([])
    })

    it('lists saved projects', () => {
      store.saveProject('site-a', { ...validConfig, name: 'site-a' })
      store.saveProject('site-b', { ...validConfig, name: 'site-b' })
      const list = store.listProjects()
      expect(list).toHaveLength(2)
      expect(list.map(p => p.name).sort()).toEqual(['site-a', 'site-b'])
    })
  })

  describe('removeProject', () => {
    it('removes an existing project', () => {
      store.saveProject('test-site', validConfig)
      expect(store.removeProject('test-site')).toBe(true)
      expect(store.getProject('test-site')).toBeNull()
    })

    it('returns false for non-existent project', () => {
      store.ensureConfigDir()
      expect(store.removeProject('nope')).toBe(false)
    })
  })

  describe('getProjectFromCwd', () => {
    it('loads project from .procyon link file', () => {
      store.saveProject('test-site', validConfig)
      const linkPath = path.join(tmpDir, '.procyon')
      fs.writeFileSync(linkPath, JSON.stringify({ project: 'test-site' }))

      const project = store.getProjectFromCwd(tmpDir)
      expect(project).toEqual(validConfig)
    })

    it('returns null when no .procyon file exists', () => {
      expect(store.getProjectFromCwd(tmpDir)).toBeNull()
    })
  })

  describe('saveLink', () => {
    it('creates a .procyon link file', () => {
      store.saveLink('my-project', tmpDir)
      const linkPath = path.join(tmpDir, '.procyon')
      const link = JSON.parse(fs.readFileSync(linkPath, 'utf8'))
      expect(link.project).toBe('my-project')
    })
  })

  describe('getEnvironment', () => {
    it('returns environment from project config', () => {
      const env = store.getEnvironment(validConfig, 'staging')
      expect(env.host).toBe('staging.example.com')
      expect(env.user).toBe('deploy')
    })

    it('returns null for non-existent environment', () => {
      expect(store.getEnvironment(validConfig, 'production')).toBeNull()
    })
  })

  describe('toEnv', () => {
    it('populates process.env from project config', () => {
      store.toEnv(validConfig, 'staging')

      expect(process.env.SITE_NAME).toBe('test-site')
      expect(process.env.LOCAL_PATH).toBe('/Users/test/Sites/test-site')
      expect(process.env.TARGET_ENV).toBe('staging')
      expect(process.env.REMOTE_SSH).toBe('deploy@staging.example.com')
      expect(process.env.REMOTE_PATH).toBe('/var/www/html')
      expect(process.env.STAGING_SSH).toBe('deploy@staging.example.com')
    })

    it('sets lando stack when wpCli is lando wp', () => {
      store.toEnv({ ...validConfig, wpCli: 'lando wp' }, 'staging')
      expect(process.env.WP).toBe('lando wp')
      expect(process.env.STACK).toBe('lando')
    })

    it('sets localwp stack by default', () => {
      store.toEnv(validConfig, 'staging')
      expect(process.env.WP).toBe('wp')
      expect(process.env.STACK).toBe('localwp')
    })

    it('sets LOCAL_DOMAIN from localDomain', () => {
      store.toEnv({ ...validConfig, localDomain: 'mysite.local' }, 'staging')
      expect(process.env.LOCAL_DOMAIN).toBe('mysite.local')
    })

    it('uses env domain for REMOTE_DOMAIN when available', () => {
      const config = {
        ...validConfig,
        environments: {
          staging: {
            ...validConfig.environments.staging,
            domain: 'staging.example.com'
          }
        }
      }
      store.toEnv(config, 'staging')
      expect(process.env.REMOTE_DOMAIN).toBe('staging.example.com')
      expect(process.env.STAGING_DOMAIN).toBe('staging.example.com')
    })

    it('falls back to user@host for REMOTE_DOMAIN when no domain set', () => {
      store.toEnv(validConfig, 'staging')
      expect(process.env.REMOTE_DOMAIN).toBe('deploy@staging.example.com')
    })
  })
})
