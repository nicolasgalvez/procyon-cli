const {exec} = require("child_process");

module.exports = {
    command: 'ls [dir]',
    describe: 'List files in the current directory. A simple command to help me learn yargs.',
    builder: {
        dir: {
            default: '.',
        }
    },
    handler: (argv) => {
        console.log('init called for dir', argv.dir)
        console.log(process.env.SITE_NAME) // This is available because of the loadEnvMiddleware
        exec("ls -la", (error, stdout, stderr) => {

            if (error) {
                console.log(`error: ${error.message}`);
                return;
            }
            if (stderr) {
                console.log(`stderr: ${stderr}`);
                return;
            }
            console.log(`stdout: ${stdout}`);
        });
    }
};