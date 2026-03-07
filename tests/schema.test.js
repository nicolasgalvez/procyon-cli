import { describe, it, expect } from 'vitest'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const { validateProject, validateLink } = require('../src/config/schema')

describe('validateProject', () => {
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

  it('accepts a valid project config', () => {
    const result = validateProject(validConfig)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('rejects missing name', () => {
    const result = validateProject({ ...validConfig, name: '' })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Missing required field: name')
  })

  it('rejects missing localPath', () => {
    const result = validateProject({ ...validConfig, localPath: undefined })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Missing required field: localPath')
  })

  it('rejects missing environments', () => {
    const result = validateProject({ name: 'test', localPath: '/tmp' })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Missing required field: environments')
  })

  it('rejects environment missing host', () => {
    const config = {
      name: 'test',
      localPath: '/tmp',
      environments: {
        staging: { user: 'deploy', path: '/var/www' }
      }
    }
    const result = validateProject(config)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Environment "staging" missing required field: host')
  })

  it('rejects environment missing user', () => {
    const config = {
      name: 'test',
      localPath: '/tmp',
      environments: {
        live: { host: 'example.com', path: '/var/www' }
      }
    }
    const result = validateProject(config)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Environment "live" missing required field: user')
  })

  it('rejects environment missing path', () => {
    const config = {
      name: 'test',
      localPath: '/tmp',
      environments: {
        staging: { host: 'example.com', user: 'deploy' }
      }
    }
    const result = validateProject(config)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Environment "staging" missing required field: path')
  })

  it('collects multiple errors', () => {
    const result = validateProject({})
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThanOrEqual(3)
  })
})

describe('validateLink', () => {
  it('accepts a valid link', () => {
    const result = validateLink({ project: 'my-site' })
    expect(result.valid).toBe(true)
  })

  it('rejects missing project', () => {
    const result = validateLink({})
    expect(result.valid).toBe(false)
  })

  it('rejects non-string project', () => {
    const result = validateLink({ project: 123 })
    expect(result.valid).toBe(false)
  })
})
