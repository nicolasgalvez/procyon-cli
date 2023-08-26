const { spawn } = require('child_process');
const { prompt } = require('enquirer');

module.exports = {
  command: 'push <target> [--remote-url] [--local-url] [-y]',
  describe: 'Pull uploads, theme, or plugins from an environment.',
  builder: {
    target: {
      demandOption: true
    },
    'remote-url': {
      default: 'public'
    },
    'local-url': {
      default: 'public'
    },
    'y': {
      describe: 'Skip confirmation prompt',
      type: 'boolean'
    }
  },
  handler: (argv) => {
    console.log(process.env.SITE_NAME); // This is available because of the loadEnvMiddleware

    const executeCommand = () => {
      let command = `${__dirname}/../../bin/db-push.sh`;

      let child = spawn(command, [argv.target], {
        stdio: 'inherit'
      });

      child.on('error', (error) => {
        console.log(`error: ${error.message}`);
      });

      child.on('close', (code) => {
        if (code !== 0) {
          console.log(`Process exited with code ${code}`);
        }
      });
    };

    if (argv.y) {
      executeCommand();
    } else {
      prompt({
        type: 'confirm',
        name: 'confirm',
        message: 'Are you sure you want to proceed?'
      })
        .then(({ confirm }) => {
          if (confirm) {
            executeCommand();
          } else {
            console.log('Operation cancelled by the user.');
          }
        })
        .catch((error) => {
          console.error('An error occurred during the prompt:', error);
        });
    }
  }
}
