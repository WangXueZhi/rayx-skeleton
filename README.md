# rayx-skeleton
骨架生成工具，帮助解决白屏体验，骨架根据页面结构生成，无需手写代码。

# 安装
--ignore-scripts 或者 env PUPPETEER_SKIP_CHROMIUM_DOWNLOAD="true" 都是用来忽略Chromium的安装，如需安装，去掉即可。

推荐不安装，直接在配置中指定本地Chrome程序地址。

```
env PUPPETEER_SKIP_CHROMIUM_DOWNLOAD="true" tnpm i rayx-skeleton --save-dev
// 或者
tnpm install rayx-skeleton --save-dev --ignore-scripts
```

# 使用

```javascript
// 导入模块
const rayxSkeleton = require("rayx-skeleton");

// 配置参数
const options = {
    // 指定chromium路径,需要绝对路径，chrome路径也可以
    chromiumPath: "/Users/xxx/xxx/Chromium.app/Contents/MacOS/Chromium",
    // 模式 server|dist|demo
    mode: "server",
    // 容器的id，骨架生成将会从该容器开始遍历，默认body
    idSelector: "",
    // demo模式页面地址
    demoUrl: "https://h5.unionvip.com/about.unionvip.html#/Cards",
    // server模式配置
    serverMode: {
        server: "http://0.0.0.0:8080",
        outputDir: "./src/skeleton",
        outputType: "html" // 输出类型 selector|html
    },
    // dist模式配置
    distMode: {
        // 页面所在目录
        assetsDir: "./dist",
        // 静态资源替换，如果不需要替换，可不填
        assetsUrl: {
             absolute: "",
             relative: "./"
         }
    },
    // 图片替换链接，如果没有，会用纯灰色图片替换
    imgReplaceUrl: "",
    // 需要生成骨架的页面
    pages: [
        {
            name: "index.html",
            routers: [
                "#/A",
                "#/B"
            ]
        },
        "list.html"
    ]
}

// 传入参数
rayxSkeleton(options);
```

# 骨架生成规则

忽略生成：
1. 节点类型为 script，style
3. 节点className中包含rayxskeleton-ignore
4. 元素宽或高为0

直接生成：
1. 直接子节点有文本节点
2. 节点className中包含rayxskeleton-translate
3. 节点类型为 img，input，i，button