const path = require('path');

function padTo2Digits(num) {
    return num.toString().padStart(2, '0');
  }
  
exports.formatDate = (date) => {
    return (
        [
        date.getFullYear(),
        padTo2Digits(date.getMonth() + 1),
        padTo2Digits(date.getDate()),
        ].join('-') +
        ' ' +
        [
        padTo2Digits(date.getHours()),
        padTo2Digits(date.getMinutes()),
        padTo2Digits(date.getSeconds()),
        ].join(':')
    );
}

exports.pathNormalize = (oldPath) => {
    let normalizedPath = oldPath.endsWith('/') ? oldPath.slice(0, -1) : oldPath;
    normalizedPath = normalizedPath + '\\'
    const opsys = process.platform
    if (opsys == "win32" || opsys == "win64")
    {
        return path.normalize(normalizedPath);
    }
    return normalizedPath.replace(/\//g, "\\") // for unix systems
}

exports.escapeRegExp = (string) => {
    return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

exports.escapeHTML = (s) => {
    if(!s)
    {
        return s
    }
    let lookup = {
        '\'': "\\'",
        '<': "&lt;",
        '>': "&gt;"
    };
    return s.replace( /['<>]/g, c => lookup[c] );
}