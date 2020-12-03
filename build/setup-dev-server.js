const fs = require('fs')
const path = require('path')
const webpack = require('webpack')

const MFS = require('memory-fs')
const chokidar = require('chokidar')

const webpackDevMiddleware = require('webpack-dev-middleware')
const webpackHotMiddleware = require('webpack-hot-middleware')

const clientConfig = require('./webpack.client.config')
const serverConfig = require('./webpack.server.config')

const readFile = (fs, file) => {
    try {
        return fs.readFileSync(path.join(clientConfig.output.path, file), 'utf-8')
    } catch (e) { }
}

module.exports = function setupDevServer(app, templatePath, cb) {
    let bundle
    let template
    let clientManifest

    let ready
    const readyPromise = new Promise(resolve => {
        ready = resolve
    })

    const update = () => {
        if (bundle && clientManifest) {
            ready()
            cb(bundle, {
                template,
                clientManifest
            })
        }
    }
    // read template from disk and watch
    template = fs.readFileSync(templatePath, 'utf-8')
    chokidar.watch(templatePath).on('change', () => {
        template = fs.readFileSync(templatePath, 'utf-8')
        console.log('index.html template updated.')
        update()
    })

    // modify client config to work with hot middleware
    clientConfig.mode = 'development'
    clientConfig.entry.app = [
        'webpack-hot-middleware/client',
        clientConfig.entry.app
    ]
    clientConfig.output.filename = '[name].js'
    clientConfig.plugins.push(
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NoEmitOnErrorsPlugin()
    )

    // dev middleware
    const clientCompiler = webpack(clientConfig)
    const devMiddleware = webpackDevMiddleware(clientCompiler, {
        publicPath: clientConfig.output.publicPath,
        noInfo: true
    })
    app.use(devMiddleware)

    clientCompiler.plugin('done', stats => {
        stats = stats.toJson()
        stats.errors.forEach(err => console.error(err))
        stats.warnings.forEach(err => console.warn(err))
        if (stats.errors.length) return
        clientManifest = JSON.parse(
            readFile(devMiddleware.fileSystem, 'vue-ssr-client-manifest.json')
        )
        update()
    })

    // 应用热更新
    app.use(webpackHotMiddleware(clientCompiler, { heartbeat: 5000 }))

    // watch and update server renderer
    const serverCompiler = webpack(serverConfig)

    const mfs = new MFS()
    serverCompiler.outputFileSystem = mfs
    serverCompiler.watch({}, (err, stats) => {
        if (err) throw err
        stats = stats.toJson()
        // 这里最好加一个打印语句，否则报错了，服务器又启动不了，让你找不到出错原因
        console.log('stats.errors===', stats.errors)
        if (stats.errors.length) return

        // read bundle generated by vue-ssr-webpack-plugin
        bundle = JSON.parse(readFile(mfs, 'vue-ssr-server-bundle.json'))
        console.log('typeof bundle===', typeof bundle)
        update()
    })

    return readyPromise
}
