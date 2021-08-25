const fs = require('fs');
const readFileLines = (filepath) => {
  const data = fs.readFileSync(filepath, "utf8");
  const lines = data.split('\r\n');
  return lines;
}

const readdirSync = (rootDir) => {
  return fs.readdirSync(rootDir);
}

const statSync = (filePath) => {
  return fs.statSync(filePath);
}

module.exports = {
  readFileLines,
  readdirSync,
  statSync
}