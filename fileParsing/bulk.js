/* eslint-disable no-restricted-syntax */
/* eslint-disable no-param-reassign */
exports.parseFile = (fileName) => {
  const patternsToRemove = [
    /\bSeason\b|\bExtras\b|\b1080p\b|\bBluray\b|\bx265\b|\bWEB\b|\b10bit\b|\bDSN\b|\COMPLETE\b/gi,
    /\([^\)]*\)/g, // Remove content within parentheses
    /\[[^\]]*\]/g, // Remove content within brackets
    /\d+-\d+/g,
    /S0\d-S0\d/g,
    /S0\d/g,
    /\s-\s/g,
  ];

  for (const pattern of patternsToRemove) {
    fileName = fileName.replace(pattern, '');
  }

  // const truncatedLine = fileName.substr(0, 20);

  // Insert spaces before capital letters
  fileName = fileName.replace(/([a-z])([A-Z])/g, '$1 $2');

  const formattedLine = fileName.replace(/\./g, ' ');

  const firstGroup = formattedLine.split(/ {2,}/)[0];

  return firstGroup.trim();
};

exports.formatBytes = (bytes) => {
  if (!+bytes) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
};
