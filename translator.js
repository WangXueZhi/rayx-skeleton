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

module.exports = {
    ignorTypes,
    translateTypes,
    inlineElementList,
    insertStyleNode,
    addClass,
    hasTextNode,
    changeNodeStyle,
    changChildsStyle,
    render
}