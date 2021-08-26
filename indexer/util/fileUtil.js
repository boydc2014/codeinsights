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

const writeFileSync = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 4));
}

const mkDirSync = (path) => {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path);
  }
}

module.exports = {
  readFileLines,
  writeFileSync,
  readdirSync,
  statSync,
  mkDirSync,
}