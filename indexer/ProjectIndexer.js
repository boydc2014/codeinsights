const { FileProcesser } = require('../utils/fileUtil');
const { parse } = require('./pathParser');
const { path } = require('../utils/pathUtil');
const execSync = require('child_process').execSync;
class ProjectIndexer {
  constructor() {
    this.importsCache = {}
  }


  getPackageReferences = (project, definedProperty) => {
    const packages = [];
    const lines = FileProcesser.readFileLines(project.path).map((l) => l.trim());
    let packageReferenceLines = lines.filter((l) => l.startsWith('<PackageReference'));
    packageReferenceLines.map((l) => {
      const tokens = l.split(' ');
      const name = tokens[1].split("\"")[1];
      let version = tokens[2] ? tokens[2].split("\"")[1] : "null";
      if (version && version.startsWith('$(')) {
        const name = version.substring(2, version.length - 1);
        version = definedProperty[name] ? definedProperty[name] : version;
      }
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

      let version = token[1] ? token[1][1] : "null";
      if (version && version.startsWith('$(')) {
        const name = version.substring(2, version.length - 1);
        version = definedProperty[name] ? definedProperty[name] : version;
      }

      packages.push({
        name: token[0][0],
        version,
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

  getTargetFramework = (project, definedProperty) => {
    const lines = FileProcesser.readFileLines(project.path).map((l) => l.trim());
    const projectTargetFrameworks = lines.filter((l) => l.startsWith('<TargetFramework>'));
    const targetFrameworks = projectTargetFrameworks.map((l) => {
      const s = l.indexOf('>');
      const e = l.indexOf('</');
      let framework = l.substring(s + 1, e)
      if (framework.startsWith('$(')) {
        const name = framework.substring(2, framework.length - 1);
        return definedProperty[name] ? definedProperty[name] : framework;
      }
      return framework;
    })

    return targetFrameworks;
  }


  getImportsProperties = (project) => {
    let importPaths = [];
    const definedProperty = {}
    const processFile = (filePath) => {
      const imports = this.getImportPath(filePath, path.dirname(filePath));
      importPaths = importPaths.concat(imports);
      imports.forEach((im) => {
        processFile(im);
      })
    }
    processFile(project.path);
    importPaths.unshift(project.path);
    importPaths.forEach((p) => {
      let fileProperties = {};
      if (this.importsCache[p]) {
        fileProperties = this.importsCache[p];
      } else {
        fileProperties = this.getProperties(p);
        this.importsCache[p] = fileProperties;
      }
      Object.assign(definedProperty, fileProperties);
    })
    return definedProperty;
  }

  getImportPath = (filePath, projectPath) => {
    if (!path.isAbsolute(filePath)) {
      filePath = path.resolve(projectPath, filePath);
    }
    let imports = [];
    try {
      const lines = FileProcesser.readFileLines(filePath).map((l) => l.trim());
      const importLines = lines.filter((l) => l.startsWith('<Import'));
      imports = importLines.map((l) => {
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
        let literalPath = parse(rawPath, filePath);
        if (!path.isAbsolute(literalPath)) {
          literalPath = path.resolve(projectPath, literalPath);
        } else {
          literalPath = path.join(literalPath);
        }
        return literalPath;
      });
    } catch (e) {
      //console.log(e);
    }
    return imports;
  }

  getProperties = (path) => {
    const properties = {};
    try {
      const lines = FileProcesser.readFileLines(path).map((l) => l.trim());

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('<PropertyGroup>')) {
          i++;
          while (!lines[i].startsWith('</PropertyGroup>')) {
            const i1 = lines[i].indexOf('<');
            const i2 = lines[i].indexOf('>');
            const i3 = lines[i].indexOf('</');
            if (i1 > -1 && i2 > -1 && i3 > -1) {
              const key = lines[i].substring(i1 + 1, i2);
              const value = lines[i].substring(i2 + 1, i3);
              properties[key] = value
            }
            i++;
          }
        }
      }
    } catch (e) {
      //console.log(e);
    }
    return properties;
  }

  getProjectFiles = (project) => {
    const projectFiles = [];
    let lineCount = 0;
    const getFiles = (rootDir) => {
      const files = FileProcesser.readdirSync(rootDir);
      files.forEach((f) => {
        const filePath = path.resolve(rootDir, f);
        const fileStat = FileProcesser.statSync(filePath);
        if (fileStat.isDirectory()) {
          getFiles(filePath);
        } else if (filePath !== project.path) { // .csproj file should not be counted
          const lines = FileProcesser.readFileLines(filePath);
          lineCount += lines.length;
          projectFiles.push({
            name: f,
            path: filePath,
          });
        }
      });
    }
    getFiles(path.dirname(project.path));

    return { fileCount: projectFiles.length, lineCount };
  }

  getProjectGitInfo = (project) => {
    //search for authors cmd may not work in Unix/Linux
    let authors = execSync(`cd ${path.dirname(project.path)} && git log --pretty=format:"%an%x09" . | sort /unique`).toString().trim();
    authors = authors.split('\t\r\n')
    const lastUpdateTime = this.formatDate(execSync(`cd ${path.dirname(project.path)} && git log -n 1 --pretty=format:%ad .`).toString().trim());
    return { authors, lastUpdateTime };
  }

  //sinceDate format: 20201231
  getRecentAuthor = (project, sinceDate) => {
    let authors = execSync(`cd ${path.dirname(project.path)} && git log --since=${sinceDate} --pretty=format:"%an%x09" . | sort /unique`).toString().trim();
    authors = authors.split('\t\r\n')
    return authors;
  }

  formatDate(date) {
    var d = new Date(date),
      month = '' + (d.getMonth() + 1),
      day = '' + d.getDate(),
      year = d.getFullYear();

    if (month.length < 2)
      month = '0' + month;
    if (day.length < 2)
      day = '0' + day;

    return [year, month, day].join('-');
  }

}




module.exports = {
  ProjectIndexer: new ProjectIndexer(),
}