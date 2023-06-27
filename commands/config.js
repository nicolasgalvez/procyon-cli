exports.command = 'config <command>'
exports.desc = 'Generate Config Files'
exports.builder = function (yargs) {
    return yargs.commandDir('config')
}
exports.handler = function (argv) {}