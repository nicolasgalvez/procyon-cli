const {exec} = require('child_process')

module.exports = {
    command: 'pull <env> [remote-path] [local-path] [theme] [plugins] [uploads]',
    describe: 'Pull uploads, theme, or plugins from an environment.',
    builder: {
        env: {
            default: 'staging'
        },
        'remote-path': {
            default: 'public'
        },
        'local-path': {
            default: 'public'
        },
        theme: {
            default: false
        },
        plugins: {
            default: false
        },
        uploads: {
            default: true
        }
    },
    handler: (argv) => {
        console.log(process.env.SITE_NAME) // This is available because of the loadEnvMiddleware
        exec('ls -la', (error, stdout, stderr) => {
            if (error) {
                console.log(`error: ${error.message}`)
                return
            }
            if (stderr) {
                console.log(`stderr: ${stderr}`)
                return
            }
            console.log(`stdout: ${stdout}`)
        })
    }
}
