const { FileProcesser } = require('../utils/fileUtil');
const { parse } = require('./pathParser');
const path = require('path');
class ProjectIndexer {
  getPackageReferences = (project) => {
    const packages = [];
    const lines = FileProcesser.readFileLines(project.path).map((l) => l.trim());
    let packageReferenceLines = lines.filter((l) => l.startsWith('<PackageReference'));
    packageReferenceLines.map((l) => {
      const tokens = l.split(' ');
      const name = tokens[1].split("\"")[1];
      const version = tokens[2] ? tokens[2].split("\"")[1] : '';
      packages.push({
        name,
        version,
      })
    })

    packageReferenceLines = lines.filter((l) => l.startsWith('<Reference '));
    packageReferenceLines.map((l) => {
      let packageInfo = l.split('"')[1];
      let token = packageInfo.split(',').map((info) => {
        const tokens = info.trim().split('=');
        return tokens;
      });
      packages.push({
        name: token[0][0],
        version: token[1] ? token[1][1] : "null",
      })
    });
    return packages;
  }

  getProjectReferences = (project) => {
    const lines = FileProcesser.readFileLines(project.path).map((l) => l.trim());
    const projectReferenceLines = lines.filter((l) => l.startsWith('<ProjectReference'));
    const projectReferences = projectReferenceLines.map((l) => {
      return path.resolve(project.path, l.split('"')[1]);
    })
    return projectReferences;
  }
}

getImports = (project) => {
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



module.exports = {
  ProjectIndexer: new ProjectIndexer(),
}