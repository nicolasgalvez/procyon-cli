const { spawn } = require('child_process')
const runCommand = require('../../src/runCommand')

module.exports = {
  command: 'push <target> [item] [single] [--remote-path] [--local-path]',
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
    },
    single: {
    }
  },
  handler: async (argv) => {
    let options = [argv.target];
    let items = argv.item === 'all' ? ['themes', 'plugins', 'uploads'] : [argv.item]
    let command = ''
    for (let item of items) {

      if (item === 'themes') {
        command = `bin/files-push-themes.sh`
      }
      if (item === 'uploads') {
        command = `bin/files-push.sh`
      }
      if (item === 'plugins') {
        command = `bin/files-push-plugins.sh`
        if(argv.single) {
          console.log('Pushing single plugin:', argv.single)  
          options.push('--single='+argv.single)
        }
      }

      try {
        await runCommand(command, options)
      } catch (error) {
        console.error('Error running command:', error)
      }
    }
  }
}
