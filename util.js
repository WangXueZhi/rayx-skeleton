const fs = require("fs");
const path = require("path");
const util = {};

/**
 * 读取路径信息
 * @param {string} path 路径
 */
util.getStat = function (path) {
    return new Promise((resolve, reject) => {
        fs.stat(path, (err, stats) => {
            if (err) {
                resolve(false);
            } else {
                resolve(stats);
            }
        })
    })
}

/**
 * 创建路径
 * @param {string} dir 路径
 */
util.mkdir = function (dir) {
    return new Promise((resolve, reject) => {
        fs.mkdir(dir, err => {
            if (err) {
                resolve(false);
            } else {
                resolve(true);
            }
        })
    })
}

/**
 * 路径是否存在，不存在则创建
 * @param {string} dir 路径
 */
util.dirExists = async function (dir) {
    let isExists = await util.getStat(dir);
    //如果该路径且不是文件，返回true
    if (isExists && isExists.isDirectory()) {
        return true;
    } else if (isExists) {     //如果该路径存在但是文件，返回false
        return false;
    }
    //如果该路径不存在
    let tempDir = path.parse(dir).dir;      //拿到上级路径
    //递归判断，如果上级目录也不存在，则会代码会在此处继续循环执行，直到目录存在
    let status = await util.dirExists(tempDir);
    let mkdirStatus;
    if (status) {
        mkdirStatus = await util.mkdir(dir);
    }
    return mkdirStatus;
}

// 替换文件内容
const replaceFileContent = function (filePath, oldContent, newContent) {
    const filedata = fs.readFileSync(filePath);
    const reg = new RegExp(oldContent, "g");
    const newText = filedata.toString().replace(reg, newContent);
    fs.writeFileSync(filePath, newText);
};

module.exports = {
    util,
    replaceFileContent
}