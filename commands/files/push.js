const {spawn} = require('child_process')

module.exports = {
  command: 'push <target> [item] [--remote-path] [--local-path]',
  describe: 'Pull uploads, theme, or plugins from an environment.',
  builder: {
    target: {
      demandOption: true
    },
    'remote-path': {
      default: 'public'
    },
    'local-path': {
      default: 'public'
    },
    item: {
      default: 'uploads',
      choices: ['themes', 'plugins', 'uploads', 'all']
    }
  },
  handler: (argv) => {
    console.log(process.env.SITE_NAME) // This is available because of the loadEnvMiddleware

    let items = argv.item === 'all' ? ['themes', 'plugins', 'uploads'] : [argv.item];

    items.forEach(item => {
      let command = ''
      console.log(item)
      if(item === 'themes') {
        console.log('matched theme')
        command = `${__dirname}/../../bin/files-push-themes.sh`
      }
      if(item === 'uploads') {
        command = `${__dirname}/../../bin/files-push.sh`
      }
      if(item === 'plugins') {
        command = `${__dirname}/../../bin/files-push-plugins.sh`
      }

      let child = spawn(command, [argv.target], {
        stdio: 'inherit'
      });

      child.on('error', (error) => {
        console.log(`error: ${error.message}`);
      });

      child.on('close', (code) => {
        if(code !== 0) {
          console.log(`Process exited with code ${code}`);
        }
      });
    });
  }
}
