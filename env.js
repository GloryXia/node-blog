const isProd = process.env.NODE_ENV === 'production'

// 例如生产环境可以换成你的阿里云地址
const host = isProd? 'www.xiachao.site' : 'localhost'
const port = isProd? '80' : '8080'

module.exports = {
    host,
    port
}