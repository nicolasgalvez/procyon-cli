# Procyon CLI Refactoring Plan

## Goals
1. Replace `.env` files with centralized config in `~/.procyon/`
2. Interactive project setup wizard
3. Refactor `files` command to support single theme transfers
4. Keep rsync for delta transfers, wrap in JavaScript
5. Add diff preview before pushing changes
6. Add rollback capability for pushes

---

## Part 1: Centralized Configuration System

### Config Location
```
~/.procyon/
├── config.json              # Global CLI settings
└── projects/
    ├── client-site-a.json   # Per-project config
    └── client-site-b.json
```

### Project Config Schema (`~/.procyon/projects/<name>.json`)
```json
{
  "name": "client-site-a",
  "localPath": "/Users/nick/Sites/client-site-a/public",
  "wpCli": "wp",
  "environments": {
    "staging": {
      "host": "staging.example.com",
      "user": "deploy",
      "port": 22,
      "path": "/var/www/html",
      "identityFile": "~/.ssh/id_rsa"
    },
    "live": {
      "host": "live.example.com",
      "user": "deploy",
      "port": 22,
      "path": "/var/www/html",
      "identityFile": "~/.ssh/id_rsa"
    }
  },
  "exclude": [
    "*.zip", "*.log", ".git", "node_modules/"
  ]
}
```

### Project Linking
In each WordPress project directory, a `.procyon` file links to the config:
```json
{
  "project": "client-site-a"
}
```

### New Directory Structure
```
src/
├── config/
│   ├── store.js           # Read/write ~/.procyon/ configs
│   ├── schema.js          # Validation for config files
│   └── ssh.js             # Build SSH connection strings from config
├── sync/
│   ├── rsync.js           # Rsync wrapper with JS control
│   ├── diff.js            # Pre-transfer diff generation
│   └── backup.js          # Backup and rollback
commands/
├── init.js                # New: interactive project setup
├── projects.js            # New: list/manage registered projects
├── files/
│   ├── pull.js
│   ├── push.js
│   └── rollback.js
```

---

## Part 2: Interactive Setup (`procyon init`)

### Flow
```
$ procyon init

? Project name: client-site-a
? Local WordPress path: /Users/nick/Sites/client-site-a/public
? WP-CLI command (wp / lando wp): wp

? Add an environment? Yes
? Environment name: staging
? SSH host: staging.example.com
? SSH user: deploy
? SSH port: 22
? Remote path: /var/www/html
? SSH identity file (leave blank for default): ~/.ssh/client_key

? Add another environment? Yes
? Environment name: live
...

? Add another environment? No

✓ Created ~/.procyon/projects/client-site-a.json
✓ Created .procyon in current directory

Run 'procyon files pull staging uploads' to sync uploads.
```

### Implementation (`commands/init.js`)
- Use enquirer for prompts
- Validate SSH connection before saving (optional `--skip-verify`)
- Create both `~/.procyon/projects/<name>.json` and local `.procyon`
- Offer to import from existing `.env` if found

---

## Part 3: Config Store Module (`src/config/store.js`)

```javascript
const os = require('os');
const path = require('path');
const fs = require('fs');

const PROCYON_DIR = path.join(os.homedir(), '.procyon');
const PROJECTS_DIR = path.join(PROCYON_DIR, 'projects');

function ensureConfigDir() { ... }
function getProject(name) { ... }
function saveProject(name, config) { ... }
function listProjects() { ... }
function getProjectFromCwd() {
  // Read .procyon file in cwd, return full project config
}
function getEnvironment(projectName, envName) {
  // Return SSH details for an environment
}
```

---

## Part 4: Rsync Wrapper (`src/sync/rsync.js`)

Keep rsync for:
- Delta transfers (only changed bytes)
- SSH config compatibility via constructed connection strings
- Proven reliability

```javascript
const { spawn } = require('child_process');

class RsyncTransfer {
  constructor(project, environment) {
    this.project = project;
    this.env = environment;
  }

  buildSshCommand() {
    const { host, user, port, identityFile } = this.env;
    let ssh = `ssh -p ${port}`;
    if (identityFile) {
      ssh += ` -i ${identityFile.replace('~', os.homedir())}`;
    }
    return ssh;
  }

  buildRemotePath(subpath) {
    const { user, host, path } = this.env;
    return `${user}@${host}:${path}/${subpath}`;
  }

  async pull(remoteSub, localSub, options = {}) {
    const args = [
      '-chavzP',
      '--stats',
      '-e', this.buildSshCommand(),
      ...this.buildExcludeArgs(),
    ];

    if (options.dryRun) args.push('--dry-run');
    if (options.delete) args.push('--delete-after');

    args.push(this.buildRemotePath(remoteSub));
    args.push(path.join(this.project.localPath, localSub));

    return this.exec(args);
  }

  async push(localSub, remoteSub, options = {}) { ... }

  async exec(args) {
    return new Promise((resolve, reject) => {
      const child = spawn('rsync', args, { stdio: 'inherit' });
      child.on('close', code => code === 0 ? resolve() : reject(code));
    });
  }
}
```

---

## Part 5: Diff Preview (`src/sync/diff.js`)

Before push, show what will change:

```javascript
async function generateDiff(rsync, localSub, remoteSub) {
  // Use rsync --dry-run --itemize-changes to get file list
  const changes = await rsync.dryRun(localSub, remoteSub);

  // Parse rsync itemize output:
  // >f.st...... file.txt  (file modified)
  // *deleting   old.txt   (file will be deleted)
  // >f+++++++++ new.txt   (new file)

  return {
    added: [...],
    modified: [...],
    deleted: [...]
  };
}

function displayDiff(changes) {
  console.log('\nChanges to be pushed:\n');

  changes.added.forEach(f => console.log(`  + ${f}`));
  changes.modified.forEach(f => console.log(`  M ${f}`));
  changes.deleted.forEach(f => console.log(`  - ${f}`));

  console.log(`\n${changes.added.length} added, ${changes.modified.length} modified, ${changes.deleted.length} deleted`);
}
```

---

## Part 6: Backup & Rollback (`src/sync/backup.js`)

### Backup Location
```
~/.procyon/backups/
└── client-site-a/
    └── staging/
        └── themes/
            └── 2024-01-15T10-30-00/
                └── theme-name/
```

### Before Push
```javascript
async function createBackup(rsync, itemType, itemName) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = getBackupPath(project, env, itemType, timestamp);

  // Pull current remote state to backup location
  await rsync.pull(
    `wp-content/${itemType}/${itemName || ''}`,
    backupPath
  );

  return { timestamp, path: backupPath };
}
```

### Rollback Command
```
procyon files rollback staging themes --list
procyon files rollback staging themes --to 2024-01-15T10-30-00
```

---

## Part 7: Refactored Commands

### `procyon init`
Interactive project setup wizard.

### `procyon projects`
```
procyon projects list              # List all registered projects
procyon projects show              # Show current project config
procyon projects remove <name>     # Unregister a project
```

### `procyon files push`
```
procyon files push <env> <item> [--name <n>] [--dry-run] [--no-backup] [--force]

# Examples:
procyon files push staging themes                    # All themes
procyon files push staging themes --name flavor      # Single theme
procyon files push staging themes --dry-run          # Preview only
procyon files push live plugins --no-backup          # Skip backup
```

### `procyon files pull`
```
procyon files pull <env> <item> [--name <n>]

# Examples:
procyon files pull staging themes --name flavor
procyon files pull live uploads
```

### `procyon files rollback`
```
procyon files rollback <env> <item> [--list] [--to <timestamp>]
```

---

## Implementation Phases

### Phase 1: Config System
- Create `src/config/store.js`
- Create `commands/init.js` with enquirer prompts
- Create `commands/projects.js` for listing/managing
- Update `index.js` middleware to read from new config (with `.env` fallback)

### Phase 2: Rsync Wrapper
- Create `src/sync/rsync.js`
- Refactor `files/pull.js` to use new wrapper
- Refactor `files/push.js` to use new wrapper
- Add `--name` flag for single theme/plugin

### Phase 3: Diff Preview
- Create `src/sync/diff.js`
- Add `--dry-run` flag that shows itemized changes
- Add confirmation prompt before actual push

### Phase 4: Backup & Rollback
- Create `src/sync/backup.js`
- Auto-backup before push (unless `--no-backup`)
- Create `commands/files/rollback.js`

### Phase 5: Cleanup
- Remove `.env` requirement (keep as optional override)
- Remove shell scripts from `bin/`
- Update CLAUDE.md and README

---

## Dependencies to Add

```json
{
  "dependencies": {
    "conf": "^12.0.0",
    "minimatch": "^9.0.0",
    "cli-progress": "^3.12.0",
    "ansi-colors": "^4.1.3"
  }
}
```

Note: `enquirer` and `chalk` already installed. `conf` provides atomic JSON config storage with schema validation (optional alternative to raw fs operations).

---

## Progress Bar Integration

### Setup (`src/ui/progress.js`)

```javascript
const cliProgress = require('cli-progress');
const colors = require('ansi-colors');

function createTransferBar() {
  return new cliProgress.SingleBar({
    format: 'Syncing |' + colors.cyan('{bar}') + '| {percentage}% | {value}/{total} files | {filename}',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true,
    clearOnComplete: true
  });
}

function createMultiBar() {
  return new cliProgress.MultiBar({
    format: '{task} |' + colors.cyan('{bar}') + '| {percentage}% | {value}/{total}',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true,
    clearOnComplete: false
  }, cliProgress.Presets.shades_grey);
}
```

### Usage with Rsync

Parse rsync's `--progress` output to update the bar:

```javascript
async exec(args, progressBar) {
  return new Promise((resolve, reject) => {
    const child = spawn('rsync', [...args, '--progress'], {
      stdio: ['inherit', 'pipe', 'inherit']
    });

    let fileCount = 0;
    child.stdout.on('data', (data) => {
      const lines = data.toString().split('\n');
      for (const line of lines) {
        // Parse rsync output for file transfers
        // "          1,234 100%    1.23MB/s    0:00:00 (xfr#1, to-chk=42/100)"
        const match = line.match(/xfr#(\d+), to-chk=(\d+)\/(\d+)/);
        if (match) {
          const [, transferred, remaining, total] = match;
          progressBar.setTotal(parseInt(total));
          progressBar.update(parseInt(transferred));
        }
      }
    });

    child.on('close', code => {
      progressBar.stop();
      code === 0 ? resolve() : reject(code);
    });
  });
}
```

### Multi-bar for Parallel Transfers

```javascript
const multibar = createMultiBar();
const themesBar = multibar.create(100, 0, { task: 'Themes ' });
const pluginsBar = multibar.create(100, 0, { task: 'Plugins' });

// Update individually
themesBar.update(50);
pluginsBar.update(25);

// When done
multibar.stop();
```

Output:
```
Themes  |████████████░░░░░░░░░░░░| 50% | 50/100
Plugins |██████░░░░░░░░░░░░░░░░░░| 25% | 25/100
```

---

## Part 8: Migration from .env (`procyon migrate`)

### Command
```
procyon migrate [--env <path>]

# Examples:
procyon migrate                    # Uses ./.env
procyon migrate --env .env.staging # Custom path
```

### Flow
```
$ procyon migrate

Found .env file with:
  SITE_NAME: client-site-a
  LOCAL_PATH: /Users/nick/Sites/client-site-a/public
  STAGING_SSH: deploy@staging.example.com
  STAGING_PATH: /var/www/html
  LIVE_SSH: deploy@live.example.com
  LIVE_PATH: /var/www/html

? Import this configuration? Yes
? Project name: client-site-a

Parsing SSH strings...
  staging: deploy@staging.example.com → host: staging.example.com, user: deploy, port: 22
  live: deploy@live.example.com → host: live.example.com, user: deploy, port: 22

✓ Created ~/.procyon/projects/client-site-a.json
✓ Created .procyon in current directory

? Delete old .env file? No (keeping as backup)

Migration complete! You can now use:
  procyon files pull staging uploads
```

### Implementation (`commands/migrate.js`)

```javascript
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { prompt } = require('enquirer');
const { saveProject } = require('../src/config/store');

module.exports = {
  command: 'migrate',
  describe: 'Import configuration from existing .env file',
  builder: {
    env: {
      default: '.env',
      describe: 'Path to .env file'
    }
  },
  handler: async (argv) => {
    const envPath = path.resolve(argv.env);

    if (!fs.existsSync(envPath)) {
      console.error(`No .env file found at ${envPath}`);
      process.exit(1);
    }

    // Parse existing .env
    const envConfig = dotenv.parse(fs.readFileSync(envPath));

    // Display what was found
    console.log('\nFound .env file with:');
    Object.entries(envConfig).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });

    const { confirm } = await prompt({
      type: 'confirm',
      name: 'confirm',
      message: 'Import this configuration?'
    });

    if (!confirm) {
      console.log('Migration cancelled.');
      return;
    }

    // Get project name
    const { projectName } = await prompt({
      type: 'input',
      name: 'projectName',
      message: 'Project name:',
      initial: envConfig.SITE_NAME || path.basename(process.cwd())
    });

    // Parse SSH strings into structured config
    const config = {
      name: projectName,
      localPath: envConfig.LOCAL_PATH,
      wpCli: envConfig.LOCAL_DOMAIN?.includes('lndo') ? 'lando wp' : 'wp',
      environments: {}
    };

    // Parse staging
    if (envConfig.STAGING_SSH) {
      config.environments.staging = parseSSHString(envConfig.STAGING_SSH);
      config.environments.staging.path = envConfig.STAGING_PATH;
    }

    // Parse live
    if (envConfig.LIVE_SSH) {
      config.environments.live = parseSSHString(envConfig.LIVE_SSH);
      config.environments.live.path = envConfig.LIVE_PATH;
    }

    // Save new config
    await saveProject(projectName, config);

    // Create local .procyon link
    fs.writeFileSync('.procyon', JSON.stringify({ project: projectName }, null, 2));

    console.log(`\n✓ Created ~/.procyon/projects/${projectName}.json`);
    console.log('✓ Created .procyon in current directory');

    // Optionally delete old .env
    const { deleteEnv } = await prompt({
      type: 'confirm',
      name: 'deleteEnv',
      message: 'Delete old .env file?',
      initial: false
    });

    if (deleteEnv) {
      fs.unlinkSync(envPath);
      console.log('✓ Deleted .env');
    } else {
      console.log('  (keeping .env as backup)');
    }

    console.log('\nMigration complete!');
  }
};

function parseSSHString(sshString) {
  // Handle formats:
  // user@host
  // user@host:port
  // host (assumes current user)

  let user, host, port = 22;

  if (sshString.includes('@')) {
    const [userPart, hostPart] = sshString.split('@');
    user = userPart;

    if (hostPart.includes(':')) {
      [host, port] = hostPart.split(':');
      port = parseInt(port);
    } else {
      host = hostPart;
    }
  } else {
    host = sshString;
    user = process.env.USER;
  }

  return { host, user, port };
}
```

### Env Variable Mapping

| .env Variable | New Config Location |
|---------------|---------------------|
| `SITE_NAME` | `name` |
| `LOCAL_PATH` | `localPath` |
| `LOCAL_DOMAIN` | Used to detect `wpCli: "lando wp"` |
| `STAGING_SSH` | `environments.staging.{host,user,port}` |
| `STAGING_PATH` | `environments.staging.path` |
| `LIVE_SSH` | `environments.live.{host,user,port}` |
| `LIVE_PATH` | `environments.live.path` |

---

## Migration Path

1. New `procyon init` creates new-style config
2. `procyon migrate` imports existing .env files
3. Old `.env` still works if present (middleware checks both)
4. Warn users with `.env` to run `procyon migrate`
5. After transition period, remove `.env` support
