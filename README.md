Procyon CLI
=
A WordPress development toolkit that automates database syncing, file transfers, and environment management between local, staging, and live environments.

## Installation
```
npm install -g procyon-cli
```

Or check out the repo and run:
```
npm link
```

## Quick Start

### New project
```bash
procyon init
```

Interactive wizard that creates a project config at `~/.procyon/projects/<name>.json` and a `.procyon` link file in your project directory.

### Existing .env project
```bash
procyon migrate
```

Imports your existing `.env` file into the new config format.

## Commands

### File Transfers

```bash
# Pull uploads from staging
procyon files pull staging uploads

# Pull a single theme
procyon files pull staging themes --name flavor

# Push themes to staging (shows diff preview, creates backup)
procyon files push staging themes

# Push a single plugin, skip confirmation
procyon files push staging plugins --name my-plugin --force

# Preview what would change without transferring
procyon files push staging themes --dry-run

# Push without creating a backup
procyon files push live themes --no-backup
```

### Rollback

```bash
# List available backups
procyon files rollback staging themes --list

# Restore from a specific backup
procyon files rollback staging themes --to 2024-01-15T10-30-00
```

### Database

```bash
procyon db pull staging
procyon db push staging
```

### Project Management

```bash
procyon projects list          # List all registered projects
procyon projects show          # Show current project config
procyon projects remove --name my-site
```

## Configuration

### New format (~/.procyon/projects/<name>.json)

```json
{
  "name": "my-site",
  "localPath": "/Users/you/Sites/my-site/public",
  "wpCli": "wp",
  "environments": {
    "staging": {
      "host": "staging.example.com",
      "user": "deploy",
      "port": 22,
      "path": "/var/www/html",
      "identityFile": "~/.ssh/my-key"
    },
    "live": {
      "host": "live.example.com",
      "user": "deploy",
      "port": 22,
      "path": "/var/www/html",
      "identityFile": "~/.ssh/my-key"
    }
  }
}
```

### Legacy format (.env)

Still supported as a fallback. See CLAUDE.md for required variables.

## Development

```bash
pnpm install
npm test
npm run lint
node index.js <command> [options]
```
