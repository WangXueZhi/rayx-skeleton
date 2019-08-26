const Koa = require('koa');
const static = require('koa-static');
const app = new Koa();// koa实例

// 启用dist模式服务
const runDistServer = function () {
    return new Promise((resolve, reject) => {
        // 配置静态web服务的中间件, 启动服务
        app.use(static(path.resolve(__dirname, config.assetsDir)));
        const server = app.listen(0, "127.0.0.1");
        server.on('listening', d => {
            resolve(server)
        });
    })
}

module.exports = {
    runDistServer
}