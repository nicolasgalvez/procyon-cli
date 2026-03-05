# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Procyon CLI is a WordPress development toolkit that automates database syncing, file transfers, and environment management between local, staging, and live environments. It's built with yargs for command-line parsing.

## Commands

```bash
# Install dependencies
pnpm install

# Lint (runs on pre-commit via husky)
npm run lint

# Run CLI locally during development
node index.js <command> [options]

# Install globally for testing
npm link
```

## Architecture

**Entry Point:** `index.js` - Sets up yargs with a unified `loadProjectMiddleware` that:
1. Skips config for setup commands (`init`, `migrate`, `projects`)
2. Tries new `.procyon` config system first
3. Falls back to legacy `.env` file if no `.procyon` link exists

**Config System:** `src/config/`
- `store.js` - CRUD for `~/.procyon/projects/*.json`, project linking, `toEnv()` bridge for backward compatibility
- `schema.js` - Validation for project configs and `.procyon` link files

**Sync System:** `src/sync/`
- `rsync.js` - `RsyncTransfer` class wrapping rsync with SSH, excludes, dry-run, and itemize-changes parsing
- `backup.js` - Timestamped backups at `~/.procyon/backups/<project>/<env>/<item>/<timestamp>/`

**Command Structure:** Uses yargs `commandDir` pattern:
```
commands/
├── init.js            # Interactive project setup wizard
├── migrate.js         # Import .env to new config format
├── projects.js        # List/show/remove registered projects
├── db.js              # Parent: 'db <command>'
├── db/
│   ├── pull.js
│   └── push.js
├── files.js           # Parent: 'files <command>'
└── files/
    ├── pull.js        # Rsync pull with --name and --dry-run
    ├── push.js        # Rsync push with diff preview, backup, confirmation
    └── rollback.js    # Restore from timestamped backups
```

**Shell Scripts (legacy):** `bin/` contains bash scripts used as fallback when no `.procyon` config exists. File commands use the new `RsyncTransfer` class when the new config is available.

**Utility Functions:** `src/` contains shared utilities:
- `runCommand.js` - Promise wrapper around spawn for legacy shell scripts
- `update-env.js` - Environment file manipulation
- `readVariablesFromTemplate.js` - Template variable extraction

## Configuration

**New format (preferred):** Run `procyon init` to create `~/.procyon/projects/<name>.json` and a `.procyon` link file in the project directory.

**Legacy format:** `.env` file with:
- `SITE_NAME`, `LOCAL_DOMAIN`, `LOCAL_PATH`
- `STAGING_DOMAIN`, `STAGING_SSH`, `STAGING_PATH`
- `LIVE_DOMAIN`, `LIVE_SSH`, `LIVE_PATH`

## Environment Detection

- Lando detection: If `wpCli` is `"lando wp"` in config (or `LOCAL_DOMAIN` contains "lndo" in legacy `.env`)
- WP Engine detection: Scripts check for "wpe-user" in paths for special export handling
