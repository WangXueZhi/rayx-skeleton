const getSettings = function (config) {
    // 基础样式
    const cssBaseRules = {
        base: {
            "display": "inline-block!important",
            // "background": "#eaeaea!important",
            // "border": "0!important",
            // "border-radius": "5px!important",
            "box-shadow": "unset!important",
            "box-sizing": "border-box!important"
        },
        imgbg: {
            "background-image": config.imgReplaceUrl ? `url(${config.imgReplaceUrl})!important` : "none!important",
            "background-size": "contain!important",
            "background-repeat": "no-repeat!important",
            "background-position": "center!important"
        },
        bg: {
            "background": "#eaeaea!important"
        }
    }
    const cssBaseText = `.rayxskeleton-base${JSON.stringify(cssBaseRules.base)}`.replace(/\"/g, "").replace(/,/g, ";") + `.rayxskeleton-base-bg${JSON.stringify(cssBaseRules.bg)}`.replace(/\"/g, "").replace(/,/g, ";") + `.rayxskeleton-base-imgbg${JSON.stringify(cssBaseRules.imgbg)}`.replace(/\"/g, "").replace(/,/g, ";");
    const skeletonContentList = ["<style>" + cssBaseText + "</style>"];

    return {
        cssBaseRules,
        cssBaseText,
        skeletonContentList
    }
}

module.exports = {
    getSettings
}