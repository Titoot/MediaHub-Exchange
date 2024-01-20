function padTo2Digits(num) {
  return num.toString().padStart(2, '0');
}

exports.formatDate = (date) => (
  `${[
    date.getFullYear(),
    padTo2Digits(date.getMonth() + 1),
    padTo2Digits(date.getDate()),
  ].join('-')
  } ${
    [
      padTo2Digits(date.getHours()),
      padTo2Digits(date.getMinutes()),
      padTo2Digits(date.getSeconds()),
    ].join(':')}`
);

exports.pathNormalize = (oldPath) => {
  const path = oldPath.endsWith('/') ? oldPath : `${oldPath}/`;
  return path.replace(/\\/g, '/');
};

exports.escapeRegExp = (string) => string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

exports.escapeHTML = (s) => {
  if (!s) {
    return s;
  }
  const lookup = {
    '\'': "\\'",
    '"': '&quot;',
    '<': '&lt;',
    '>': '&gt;',
  };
  return s.replace(/['"<>]/g, (c) => lookup[c]);
};
