# rayx-skeleton
1. 为了解决react或vue完成渲染前的白屏问题。
2. 通过页面骨架填充的方式，给用户展示页面预期的内容，增强用户体验。
3. 开发者只需安装骨架生成工具的依赖，在做一个简单的配置文件，即可生成页面骨架，对业务逻辑没有入侵，可以轻松上手。
4. 开发者可以在业务中插入标记控制骨架生成的颗粒度。

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
    demoUrl: "",
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