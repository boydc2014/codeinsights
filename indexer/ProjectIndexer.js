const { FileProcesser } = require('../utils/fileUtil');
const { parse } = require('./pathParser');

class ProjectIndexer {
  getProjectPackageReference = (project) => {
    const packages = [];
    const lines = FileProcesser.readFileLines(project.path).map((l) => l.trim());
    const packageReferenceLines = lines.filter((l) => l.startsWith('<PackageReference'));
    packageReferenceLines.map((l) => {
      const tokens = l.split(' ');
      const name = tokens[1].split("\"")[1];
      const version = tokens[2] ? tokens[2].split("\"")[1] : '';
      packages.push({
        name,
        version,
      })
    })
    return packages;
  }

  getProjectImport = (project) => {
    const lines = FileProcesser.readFileLines(project.path).map((l) => l.trim());
    const importLines = lines.filter((l) => l.startsWith('<Import'));

    const imports = importLines.map((l) => {
      let i = 0;
      let first = -1;
      let second = -1;
      while (i < l.length) {
        if (l[i] === '"') {
          if (first === -1) {
            first = i;
          } else {
            second = i;
            break
          }
        }
        i++;
      }
      const rawPath = l.substring(first + 1, second)
      const realPath = parse(rawPath, project.path);
      return realPath;
    });
    return imports;
  }
}

module.exports = {
  ProjectIndexer: new ProjectIndexer(),
}