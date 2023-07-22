const {exec} = require('child_process')

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
    handler: (argv) => {
        console.log(process.env.SITE_NAME) // This is available because of the loadEnvMiddleware

        let items = argv.item === 'all' ? ['themes', 'plugins', 'uploads'] : [argv.item];

        items.forEach(item => {
            let command = ''
            console.log(item)
            if(item === 'themes') {
                console.log('matched themes')
                item = 'themes';
                //let command  = `rsync -chavzP --stats --exclude-from='bin/rsync-exclude' ${argv.remotePath}/wp-content/${item} ${argv.localPath}/${item} ${argv.target} `
                command = `${__dirname}/../../bin/files-pull-themes.sh ${argv.target}`
            }
            // let command  = `rsync -chavzP --stats --exclude-from='bin/rsync-exclude' ${argv.localPath}/${item} ${argv.target} ${argv.remotePath}/wp-content/${item}`

            exec(command, (error, stdout, stderr) => {
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
        });
    }
}
