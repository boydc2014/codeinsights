const fs = require('fs');
const { path } = require('../utils/pathUtil');

class FileProcesser {

  glob = (directory, postfix) => {
    var results = [];
    const searchDir = (dir) => {
      const files = fs.readdirSync(dir);
      files.forEach((f) => {
        const filePath = path.resolve(dir, f);
        const fileStat = fs.statSync(filePath);
        if (fileStat.isDirectory()) {
          searchDir(filePath);
        } else if (f.endsWith(postfix)) {
          results.push(filePath);
        }
      });
    }
    searchDir(directory);
    return results;
  }

  readFileLines = (filepath) => {
    const data = fs.readFileSync(filepath, "utf8");
    const lines = data.split('\r\n');
    return lines;
  }

  readdirSync = (rootDir) => {
    return fs.readdirSync(rootDir);
  }

  statSync = (filePath) => {
    return fs.statSync(filePath);
  }

  writeFileSync = (filePath, data) => {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 4));
  }

  mkDirSync = (path) => {
    if (!fs.existsSync(path, { recursive: true })) {
      fs.mkdirSync(path);
    }
  }

  existsSync = (path) => {
    return fs.existsSync(path);
  }
}



module.exports = {
  FileProcesser: new FileProcesser(),
}