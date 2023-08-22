#!/usr/bin/env node

const argv = require('yargs')
  .option('siteName', {
    description: 'Site Name',
    type: 'string',
  })
  .option('liveDomain', {
    description: 'Live Domain',
    type: 'string',
  })
  .option('stagingDomain', {
    description: 'Staging Domain',
    type: 'string',
  })
  .option('localDomain', {
    description: 'Local Domain',
    type: 'string',
  })
  .option('stagingSsh', {
    description: 'Staging SSH',
    type: 'string',
  })
  .option('liveSsh', {
    description: 'Live SSH',
    type: 'string',
  })
  .option('remotePath', {
    description: 'Remote Path',
    type: 'string',
  })
  .option('localPath', {
    description: 'Local Path',
    type: 'string',
  })
  .option('stagingPath', {
    description: 'Staging Path',
    type: 'string',
  })
  .argv;

const fs = require('fs');
const readlineSync = require('readline-sync');

const envFilePath = '.env';
const env = {};

// Load existing env file if it exists
if (fs.existsSync(envFilePath)) {
  const envFile = fs.readFileSync(envFilePath, { encoding: 'utf-8' });
  envFile.split('\n').forEach((line) => {
    const [key, value] = line.split('=');
    if (key && value) {
      env[key] = value;
    }
  });
}

// Ask for each item in env
const siteName = argv.siteName || env.SITE_NAME || readlineSync.question('Site Name:');
const liveDomain = argv.liveDomain || env.LIVE_DOMAIN || readlineSync.question('Live Domain:');
const stagingDomain = argv.stagingDomain || env.STAGING_DOMAIN || readlineSync.question('Staging Domain:');
const localDomain = argv.localDomain || env.LOCAL_DOMAIN || readlineSync.question('Local Domain:');
const stagingSsh = argv.stagingSsh || env.STAGING_SSH || readlineSync.question('Staging SSH:');
const liveSsh = argv.liveSsh || env.LIVE_SSH || readlineSync.question('Live SSH:');
const remotePath = argv.remotePath || env.REMOTE_PATH || readlineSync.question('Remote Path:');
const localPath = argv.localPath || env.LOCAL_PATH || readlineSync.question('Local Path:');
const stagingPath = argv.stagingPath || env.STAGING_PATH || readlineSync.question('Staging Path:');

// Write to env file
fs.writeFileSync(
  envFilePath,
  `SITE_NAME=${siteName}\nLIVE_DOMAIN="${liveDomain}"\nSTAGING_DOMAIN="${stagingDomain}"\nLOCAL_DOMAIN="${localDomain}"\nSTAGING_SSH="${stagingSsh}"\nLIVE_SSH="${liveSsh}"\nREMOTE_PATH="${remotePath}"\nLOCAL_PATH="${localPath}"\nSTAGING_PATH="${stagingPath}"\n`
);

console.log('Updated .env file:');
console.log(fs.readFileSync(envFilePath, { encoding: 'utf-8' }));
