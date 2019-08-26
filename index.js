const puppeteer = require('puppeteer');
const devices = require('puppeteer/DeviceDescriptors');
const fs = require("fs");
const path = require("path");
const cwdPath = process.cwd();
const { getSettings } = require("./settings");
const { runDistServer } = require('./server');
const { util, replaceFileContent } = require("./util.js");

// config
let config = null;

// 默认选择器
const defaultSelector = "";

// 转换骨架
const skeleton = async function ({ browserPage, pageName, pageRouters = [], rootUrl, selector, config }) {
    console.log("转换骨架", pageName, selector)

    const settings = getSettings(config);
    const cssBaseRules = settings.cssBaseRules;
    const cssBaseText = settings.cssBaseText;
    const skeletonContentList = settings.skeletonContentList;

    // 页面名字
    let pageUrl = pageName;

    // 骨架容器（不包含骨架内容）, 整个html容器（不包含骨架内容）
    let selectorOuterContainer, outerHTMLContainer;

    // 有路由
    if (pageRouters.length > 0) {
        for (let i = 0; i < pageRouters.length; i++) {
            pageUrl = pageName + `?t=${Math.random()}` + pageRouters[i];
            console.log("有路由", `${rootUrl}/${pageUrl}`)
            let skeletonObject = await toSkeletonPage(`${rootUrl}/${pageUrl}`, false);
            console.log(skeletonObject.urlHash)
            skeletonContentList.push(skeletonObject.selectorInner);
            if (i == pageRouters.length - 1) {
                skeletonContentList.push(`<script>
                    var rayxskeleton_patt = new RegExp("/","g");
                    var rayxskeleton_hashId = location.hash.replace("#", "").replace(rayxskeleton_patt, "-");
                    var rayxskeleton_routerEleList = document.querySelectorAll("${selector}>div");
                    rayxskeleton_routerEleList.forEach(function(ele, index){
                        if(ele.id==rayxskeleton_hashId){
                            ele.style.display = "block";
                        }else{
                            ele.parentNode.removeChild(ele);
                        }  
                    });
                </script>`)
            }
            if (!selectorOuterContainer) {
                selectorOuterContainer = skeletonObject.selectorOuterContainer;
            }
            if (!outerHTMLContainer) {
                outerHTMLContainer = skeletonObject.outerHTMLContainer;
            }
        }
    }

    // 没路由
    if (pageRouters.length <= 0) {
        if (config.mode == "demo") {
            let content = await toSkeletonPage(pageUrl, true).selectorInner;
            // demo模式好像把内容存起来没用？
            // skeletonContentList.push(content);
        } else {
            console.log("没有路由", `${rootUrl}/${pageUrl}`)
            let skeletonObject = await toSkeletonPage(`${rootUrl}/${pageUrl}`, false);
            skeletonContentList.push(skeletonObject.selectorInner);
            if (!selectorOuterContainer) {
                selectorOuterContainer = skeletonObject.selectorOuterContainer;
            }
            if (!outerHTMLContainer) {
                outerHTMLContainer = skeletonObject.outerHTMLContainer;
            }
        }
    }

    /**
     * 跳转到指定页面并在页面内转换骨架
     * @param {string} page 页面路径
     * @param {boolean} ifInsertStyleNode 是否插入内联的style节点
     */
    async function toSkeletonPage(page, ifInsertStyleNode) {
        // 跳转界面
        await browserPage.goto(page, { waitUntil: 'networkidle2', timeout: 30000000 });
        // 等待元素出现
        // await browserPage.waitFor('.AppContainer');
        await browserPage.waitFor(2000);
        // 截图
        // await browserPage.screenshot({ path: 'example.png' });

        // 转换成骨架并返回元素字符串
        const element = await browserPage.evaluate(async ({ config, selector, ifInsertStyleNode, cssBaseRules, cssBaseText }) => {

            // 忽略转换的清单
            const ignorTypes = ["SCRIPT", "STYLE"];

            // 直接转换的清单
            const translateTypes = ["IMG", "INPUT", "I", "BUTTON"];

            // 行内元素清单
            const inlineElementList = ["IMG", "INPUT", "A", "SPAN", "I", "BUTTON", "LABEL", "SELECT", "TEXTAREA"];


            // 插入基础样式
            const insertStyleNode = function (selector, cssBaseText) {
                var style = document.createElement("style");
                style.id = "rayxskeleton-style-tag";
                var cssText = document.createTextNode(cssBaseText);
                style.appendChild(cssText);
                document.querySelector(selector).prepend(style);
                return style;
            }

            // 添加样式
            const addClass = function (node, className) {
                const classList = node.className.split(" ");
                classList.push(className);
                node.className = classList.join(" ");
            }

            // 一级子节点是否有文本节点
            const hasTextNode = function (node) {
                let childNodes = node.childNodes;
                for (let i = 0; i < childNodes.length; i++) {
                    if (childNodes[i].nodeName == "#text" && !!childNodes[i].textContent.replace(/\s+/g, "")) {
                        return true;
                    }
                }
                return false;
            }

            // 修改样式
            const changeNodeStyle = function (nodeObject, imgReplaceUrl) {
                const ele = nodeObject.ele;
                const CSSStyleDeclaration = window.getComputedStyle(ele, null);
                let eleW, eleH = 0;

                // 如果是行内元素，但是block，先获取容器大小再进行处理
                if (inlineElementList.includes(nodeObject.type) && CSSStyleDeclaration.display == "block") {
                    eleW = ele.offsetWidth;
                    eleH = ele.offsetHeight;
                    ele.style.width = eleW + "px";
                    ele.style.height = eleH + "px";
                    // 添加基础样式
                    addClass(ele, "rayxskeleton-base");
                } else {
                    // 添加基础样式
                    addClass(ele, "rayxskeleton-base");
                    eleW = ele.offsetWidth;
                    eleH = ele.offsetHeight;
                    ele.style.width = eleW + "px";
                    ele.style.height = eleH + "px";
                }

                // 如果没有背景颜色，则添加灰色背景
                if (CSSStyleDeclaration.backgroundColor == "rgba(0, 0, 0, 0)") {
                    addClass(ele, "rayxskeleton-base-bg");
                }

                // 如果有背景图片，替换背景图片
                if (CSSStyleDeclaration.backgroundImage != "none" || !!ele.style.backgroundImage) {
                    addClass(ele, "rayxskeleton-base-imgbg");
                }

                // 根据节点类型做最后处理
                switch (nodeObject.type) {
                    case "IMG":
                        if (imgReplaceUrl) {
                            ele.src = imgReplaceUrl || "//oss.weidai.com.cn/rayxskeleton-img-placeholder.jpg";
                            if (!!ele.srcset) {
                                ele.srcset = imgReplaceUrl || "//oss.weidai.com.cn/rayxskeleton-img-placeholder.jpg"
                            }
                        }
                        break;
                    case "INPUT":
                        ele.placeholder = "";
                        break;
                    default:
                        // if (CSSStyleDeclaration.textAlign != "center") {
                        //     ele.innerHTML = "";
                        // }
                        ele.innerHTML = "";
                        break;
                }
            }

            // 遍历子元素并修改样式
            const changChildsStyle = function (eleChildren, imgReplaceUrl) {
                for (let i = 0; i < eleChildren.length; i++) {
                    // 如果当前节点属于直接忽略的类型
                    if (ignorTypes.includes(eleChildren[i].nodeName)) {
                        continue;
                    }
                    // 如果className包含rayxskeleton-ignore
                    if (eleChildren[i].className.indexOf("rayxskeleton-ignore") >= 0) {
                        continue;
                    }
                    // 如果宽高为0
                    if (eleChildren[i].offsetWidth == 0 || eleChildren[i].offsetHeight == 0) {
                        continue;
                    }
                    // 如果当前节点属于直接转换的类型 || 包含样式类名rayxskeleton-translate
                    if (translateTypes.includes(eleChildren[i].nodeName) || eleChildren[i].className.indexOf("rayxskeleton-translate") >= 0) {
                        changeNodeStyle({
                            type: eleChildren[i].nodeName,
                            ele: eleChildren[i]
                        }, imgReplaceUrl);
                        continue;
                    }
                    // 如果有子节点
                    if (eleChildren[i].childNodes.length > 0) {
                        // 如果一级子节点包含文本节点 或者 
                        if (hasTextNode(eleChildren[i])) {
                            changeNodeStyle({
                                type: eleChildren[i].nodeName,
                                ele: eleChildren[i],
                                hasText: true
                            }, imgReplaceUrl);
                        } else {
                            // 递归
                            changChildsStyle(eleChildren[i].children, imgReplaceUrl)
                        }
                    } else {
                        changeNodeStyle({
                            type: eleChildren[i].nodeName,
                            ele: eleChildren[i],
                            hasText: false
                        }, imgReplaceUrl);
                    }
                }
            }

            // 渲染
            const render = function (selector, ifInsertStyleNode, imgReplaceUrl, cssBaseText, mode) {
                // 插入基础样式
                let styleNode = insertStyleNode(selector, cssBaseText);

                // 开始遍历修改子元素
                changChildsStyle(document.querySelector(selector).children, imgReplaceUrl);
                // console.log(document.querySelector(selector).children)

                if (!ifInsertStyleNode) {
                    document.querySelector(selector).removeChild(styleNode)
                }

                let urlHash = location.hash;
                if (!!urlHash) {
                    const divContainer = document.createElement("div");

                    // 设置id
                    divContainer.id = urlHash.replace("#", "").replace(/\//g, "-");

                    // demo模式下不用隐藏
                    if (mode != "demo") {
                        divContainer.style.display = "none";
                    }

                    // 获取内容
                    divContainer.innerHTML = document.querySelector(selector).innerHTML;

                    // 生成样式
                    let cssText = "";
                    let styleSheets = document.styleSheets;
                    for (let i = 0; i < styleSheets.length; i++) {
                        if (!!styleSheets[i].href && styleSheets[i].href.indexOf(location.origin) == 0) {
                            let cssRules = styleSheets[i].cssRules;
                            for (let j = 0; j < cssRules.length; j++) {
                                cssText += cssRules[j].cssText;
                            }
                        }
                    }
                    let style = document.createElement("style");
                    let cssTextNode = document.createTextNode(cssText);
                    style.appendChild(cssTextNode);
                    divContainer.prepend(style);

                    document.querySelector(selector).innerHTML = divContainer.outerHTML;
                }

                let selectorOuter = document.querySelector(selector).outerHTML;
                let selectorInner = document.querySelector(selector).innerHTML;
                let selectorOuterContainer = selectorOuter.replace(selectorInner, "rayxskeleton_selectorInner");
                let outerHTML = document.querySelector("html").outerHTML;
                let outerHTMLContainer = outerHTML.replace(selectorInner, "rayxskeleton_selectorInner");

                // 返回最终html字符串
                return {
                    selectorInner,// 骨架内容
                    selectorOuterContainer,// 骨架容器（不包含骨架内容）
                    outerHTMLContainer,// 整个html容器（不包含骨架内容）
                    urlHash: location.hash
                };
            }

            return render(selector, ifInsertStyleNode, config.imgReplaceUrl, cssBaseText, config.mode);
        }, { config, selector, ifInsertStyleNode, cssBaseRules, cssBaseText });

        return element;
    }

    // 如果是demo模式，不需要改写文件
    if (config.mode != "demo") {
        // 读取空html文件内容，替换<div id="app"></div>成最终渲染内容，写入html
        if (config.mode == "dist") {
            console.log("dist模式")
            const filedata = fs.readFileSync(`${config.assetsDir}/${pageName}`);

            // 替换正则
            let patt = "";
            if (selector == "body") {
                patt = new RegExp(`<div id="${selector.split("#")[1]}">[\\s\\S]*?<\/div>`);
            } else {
                patt = new RegExp(`<body[\\s\\S]*?<\/body>`);
            }

            // 替换内容
            let elementContent = "";
            if (selector == "body") {
                elementContent = `<body>${skeletonContentList.join("")}</body>`
            } else {
                elementContent = `<div id="${selector.split("#")[1]}">${skeletonContentList.join("")}</div>`;
            }

            // 替换后写入
            const newText = filedata.toString().replace(patt, elementContent);
            fs.writeFileSync(`${config.assetsDir}/${pageName}`, newText);
        }

        // server模式
        if (config.mode == "server") {
            console.log("server模式", config.serverMode.outputType)
            if (config.serverMode.outputType == "selector") {
                const newText = `${skeletonContentList.join("")}`;
                // 检查目录是否存在，不存在就创建目录
                await util.dirExists(config.serverMode.outputDir);
                fs.writeFileSync(`${config.serverMode.outputDir}/${pageName}`, newText);
            }
            if (config.serverMode.outputType == "html") {
                let outerHTMLContainerArr = outerHTMLContainer.split("rayxskeleton_selectorInner");
                const newText = `${outerHTMLContainerArr[0]}${skeletonContentList.join("")}${outerHTMLContainerArr[1]}`;
                // 检查目录是否存在，不存在就创建目录
                await util.dirExists(config.serverMode.outputDir);
                fs.writeFileSync(`${config.serverMode.outputDir}/${pageName}`, newText);
            }
        }
    }
};

// 替换资源路径
const replaceAssetsPath = async function (pageName, skeletonFunc) {
    console.log("替换资源路径", pageName)
    // 替换页面文件内的资源路径
    if (config.mode == "dist" && config.distMode.assetsUrl.absolute && config.distMode.assetsUrl.relative) {
        replaceFileContent(`${config.assetsDir}/${pageName}`, config.distMode.assetsUrl.absolute, config.distMode.assetsUrl.relative);
    }
    await skeletonFunc();
    // 替换回来
    if (config.mode == "dist" && config.distMode.assetsUrl.absolute && config.distMode.assetsUrl.relative) {
        replaceFileContent(`${config.assetsDir}/${pageName}`, config.distMode.assetsUrl.relative, config.distMode.assetsUrl.absolute);
    }
}

// 主流程
const main = async function (options) {

    if (!options) {
        console.error("缺少options参数");
        return;
    }

    if (!options.mode) {
        console.error("缺少mode配置，可以是demo|server|dist");
        return;
    }

    config = options;

    // server
    let server = null;

    // puppeteer设置
    let puppeteerOption = {};

    // 访问目录
    let rootUrl = "";

    if (config.mode == "server") {
        if (!options.serverMode || !config.serverMode.server) {
            console.error("server模式下，缺少serverMode.server配置");
            return;
        }
        rootUrl = config.serverMode.server;
    }

    if (config.mode == "dist") {
        // 启动dist服务
        server = await runDistServer();
        rootUrl = `http://${server.address().address}:${server.address().port}`;
    }

    if (config.mode == "demo") {
        puppeteerOption = {
            headless: false,
            devtools: true
        };
    }

    if (config.chromiumPath) {
        puppeteerOption.executablePath = config.chromiumPath;
    }
    // 运行浏览器
    const browser = await puppeteer.launch(puppeteerOption);

    // 创建页面
    const browserPage = await browser.newPage();

    // 设置手机模拟
    // 获取手机模拟类型
    const iPhone = devices[config.devices || 'iPhone 5'];
    await browserPage.emulate(iPhone);

    if (config.mode == "demo") {
        if (!config.demoUrl) {
            console.error("demo模式下，缺少demoUrl配置");
            return;
        }
        let selector = config.idSelector ? `#${config.idSelector}` : "body";
        await skeleton({
            browserPage, pageName: config.demoUrl, selector, config
        });
    } else {
        if (!config.pages || config.pages.length < 0) {
            console.error("server或dist模式下，缺少pages配置");
            return;
        }
        // 遍历页面
        for (let i = 0; i < config.pages.length; i++) {
            const page = config.pages[i];
            if (typeof page == "object") {
                if (!page.name) {
                    console.error("page缺少name属性");
                    return;
                }
                let pageName = page.name;
                let idSelector = page.idSelector || config.idSelector;
                let selector = idSelector ? `#${idSelector}` : "body";
                if (page.routers && page.routers.length > 0) {
                    // 制作骨架
                    await replaceAssetsPath(pageName, async function () {
                        await skeleton({
                            browserPage, pageName, pageRouters: page.routers, rootUrl, selector, config: config
                        });
                    })
                } else {
                    // 制作骨架
                    await replaceAssetsPath(pageName, async function () {
                        await skeleton({
                            browserPage, pageName, rootUrl, selector, config: config
                        });
                    })
                }
            } else {
                let selector = config.idSelector ? `#${config.idSelector}` : "body";
                // 制作骨架
                await replaceAssetsPath(page, async function () {
                    await skeleton({
                        browserPage, pageName: page, rootUrl, selector, config: config
                    });
                })
            }
        }
    }

    if (config.mode == "dist" || config.mode == "server") {
        // 关闭浏览器
        await browser.close();
    }

    if (config.mode == "dist") {
        // 关闭服务
        server.close();
    }
}

module.exports = main;