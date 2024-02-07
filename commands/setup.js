exports.command = 'setup <command>'
exports.desc = 'Setup commands'
exports.builder = function (yargs) {
  return yargs.commandDir('setup')
}
exports.handler = function (argv) {}
