const fs = require('fs');
class FileProcesser {
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
    if (!fs.existsSync(path)) {
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