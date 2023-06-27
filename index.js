#!/usr/bin/env node
const yargs = require('yargs/yargs');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

/**
 * Log a message if verbose logging is enabled
 * @param message
 */
const log = (argv, message) => {
    if (argv.verbose) {
        console.log(message);
    }
}

const argv = yargs(process.argv.slice(2))
    .scriptName("procyon-cli")
    .option('config', {
        description: 'Path to the config file',
        default: 'config/procyon-config.yml',
        alias: 'c',
        type: 'string'
    })
    .option('env', {
        description: 'Path to the .env file',
        default: './.env',
        alias: 'e',
        type: 'string'
    })
    .option('verbose', {
        alias: 'v',
        type: 'boolean',
        description: 'Run with verbose logging',
    })
    .middleware(loadEnvMiddleware) // Load the .env file and make it available in modules.
    .middleware(checkEnvKeysMiddleware) // Check required keys in .env file
    .middleware(loadConfig) // Load the .env file and make it available in modules.
    .commandDir('commands') // Load commands from the `commands` directory
    .demandCommand(1, '')
    .help()
    .argv;


/**
 * Load the .env file based on the provided or default path
 * @param argv
 * @returns {*}
 */
function loadEnvMiddleware(argv) {
    const envPath = path.resolve(process.cwd(), argv.env);
    if (!fs.existsSync(envPath)) {
        console.error('.env file not found at ' + envPath);
        process.exit(1);
    }
    dotenv.config({path: envPath});
    return argv;
}

/**
 * Load the config file based on the provided or default path
 * @param argv
 */
function loadConfig(argv) {
    const configPath = path.resolve(process.cwd(), argv.config);

    if (fs.existsSync(configPath)) {
        log(argv, `Loading config from ${configPath}`);
        const config = require(configPath);
        argv.config = config;
    } else {
        log(argv, `Config file not found at ${configPath}`);
    }

    return argv;
}

/**
 * Check that all required keys are present in the .env file
 * @param argv
 * @returns {*}
 */
function checkEnvKeysMiddleware(argv) {
    const requiredKeys = [
        'SITE_NAME',
        'LIVE_DOMAIN',
        'STAGING_DOMAIN',
        'LOCAL_DOMAIN',
        'STAGING_SSH',
        'LIVE_SSH',
        'REMOTE_PATH',
        'STAGING_PATH',
        'LIVE_PATH',
        'LOCAL_PATH'
    ];

    const missingKeys = requiredKeys.filter(key => !(key in process.env));

    if (missingKeys.length > 0) {
        console.error('The following environment variable(s) are missing:');
        console.error(missingKeys.join(', '));
        process.exit(1);
    }

    return argv;
}