const { FileProcesser } = require('../utils/fileUtil');
const { parse } = require('./pathParser');
const { path } = require('../utils/pathUtil');
const execSync = require('child_process').execSync;
const fs = require('fs');

const buildDefPath = "/Build/onebranch/generated/buddy.yml";

const formatDate = (date) => {
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

class ProjectIndexer {
  constructor(rootDir) {
    this.importsCache = {}
    this.rootDir = rootDir;
    this.buildDef = fs.readFileSync(path.resolve(rootDir, buildDefPath), "utf-8").toLowerCase(); 
  }

  indexProjects(projFilePaths) 
  {
    // First pass, do basic indexing
    const projectsIndex = projFilePaths.map(projFilePath => {
      console.log(`\t Indexing ${path.relative(this.rootDir, projFilePath)}`)
      return this.indexProject(path.unify(projFilePath))
    });

    // Second pass, tries to fill in the referedBy
    const projectsIndexMap = Object.fromEntries(projectsIndex.map(x => [x.path, x]));
    projectsIndex.forEach(p => {
      p.refers.forEach(re => {
        if (re in projectsIndexMap){
          projectsIndexMap[re].referedBy.push(p.path);
        } else {
          console.log(`[WARN]: project ${p.path} refers non-existing project ${re}`);
        }
      })
    })

    return Object.entries(projectsIndexMap).map(entry => entry[1]);
  }

  indexProject = (projPath) => {
    let projectIndex = {
      name: path.basename(projPath),
      path: projPath,
      relativePath: path.relative(this.rootDir, projPath),
      isTest: false,
      inBuild: false,
      packages: [],
      containedBy: [],
      refers: [],
      referedBy: [],
      targetFrameworks: [],
      fileCount: 0,
      lineCount: 0
    }

    projectIndex.isTest = projectIndex.name.toLowerCase().includes("test.csproj") || projectIndex.name.toLowerCase().includes("tests.csproj");
    // project are refered with relative path in build def, and seperator is \ instead of /
    projectIndex.inBuild = this.buildDef.includes(projectIndex.relativePath.replace(/\//g, '\\').toLowerCase());
    projectIndex.refers = this._getProjectReferences(projPath).map(re => path.unify(re));

    const definedProperties = this._getImportsProperties(projPath);
    projectIndex.targetFrameworks = this._getTargetFramework(projPath, definedProperties);
    
    const { authors, lastUpdateTime } = this._getProjectGitInfo(projPath);
    projectIndex.authors = authors;
    projectIndex.lastUpdateTime = lastUpdateTime;

    const { fileCount, lineCount } = this._getProjectFiles(projPath);
    projectIndex.fileCount = fileCount;
    projectIndex.lineCount = lineCount;

    return projectIndex;
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

  _getProjectReferences = (projPath) => {
    const lines = FileProcesser.readFileLines(projPath).map((l) => l.trim());
    const projectReferenceLines = lines.filter((l) => l.startsWith('<ProjectReference'));
    const projectReferences = projectReferenceLines.map((l) => {
      // NOTE: the project reference's relative location is based on the dir, not the csproj file itself
      return path.resolve(path.dirname(projPath), l.split('"')[1]);  
    })
    return projectReferences;
  }

  _getTargetFramework = (projPath, definedProperty) => {
    const lines = FileProcesser.readFileLines(projPath).map((l) => l.trim());
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


  _getImportsProperties = (projPath) => {
    const initialProperties = {
      "IbizaExtensionVersion": "1.4.1.x",
      "IntercomWebUIVersion": "1.6.20-92600",
      "IntercomClientWebUIVersion": "1.1.30-107739",
      "IntercomBotAppTemplatesVersion": "1.3.27-92712",
    }

    let importPaths = [];
    const definedProperty = {}
    const processFile = (filePath) => {
      const imports = this.getImportPath(filePath, path.dirname(filePath));
      importPaths = importPaths.concat(imports);
      imports.forEach((im) => {
        processFile(im);
      })
    }
    processFile(projPath);
    importPaths.unshift(projPath);
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

    Object.assign(definedProperty, initialProperties);
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

  _getProjectFiles = (projPath) => {
    const csFiles = FileProcesser.glob(path.dirname(projPath), ".cs");
    let lineCount = 0;
    csFiles.forEach(csFile => {
      const lines = FileProcesser.readFileLines(csFile);
      lineCount += lines.length;
    });
    return { fileCount: csFiles.length, lineCount };
  }

  _getProjectGitInfo = (projPath) => {
    //search for authors cmd may not work in Unix/Linux
    let authors = execSync(`cd ${path.dirname(projPath)} && git log --pretty=format:"%an%x09" . | sort /unique`).toString().trim();
    authors = authors.split('\t\r\n')
    const lastUpdateTime = formatDate(execSync(`cd ${path.dirname(projPath)} && git log -n 1 --pretty=format:%ad .`).toString().trim());
    return { authors, lastUpdateTime };
  }

  //sinceDate format: 20201231
  getRecentAuthor = (project, sinceDate) => {
    let authors = execSync(`cd ${path.dirname(project.path)} && git log --since=${sinceDate} --pretty=format:"%an%x09" . | sort /unique`).toString().trim();
    authors = authors.split('\t\r\n')
    return authors;
  }
}



module.exports = {
  ProjectIndexer: ProjectIndexer,
  formatDate: formatDate,
}