const runCommand = require('../../src/runCommand')

module.exports = {
  command: 'pull <target> [item] [--remote-path] [--local-path]',
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
  handler: async (argv) => {  // Note the added async keyword
    let items = argv.item === 'all' ? ['themes', 'plugins', 'uploads'] : [argv.item]
    for (let item of items) {  // Note the changed loop
      let command
      if (item === 'themes') {
        command = `bin/files-pull-themes.sh`
      }
      if (item === 'uploads') {
        command = `bin/files-pull.sh`
      }
      if (item === 'plugins') {
        command = `bin/files-pull-plugins.sh`
      }
      try {
        await runCommand(command, [argv.target])
      } catch (error) {
        console.error('Error running command:', error)
      }
    }
  }
}
