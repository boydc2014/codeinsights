const { FileProcesser } = require('../utils/fileUtil');
const { parse } = require('./pathParser');
const path = require('path');
const execSync = require('child_process').execSync;
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

  getTargetFramework = (project) => {
    const lines = FileProcesser.readFileLines(project.path).map((l) => l.trim());
    const projectTargetFrameworks = lines.filter((l) => l.startsWith('<TargetFramework>'));
    const targetFrameworks = projectTargetFrameworks.map((l) => {
      const s = l.indexOf('>');
      const e = l.indexOf('</');
      return l.substring(s + 1, e);
    })
    return targetFrameworks;
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
    const lastUpdate = execSync(`cd ${path.dirname(project.path)} && git show -s --format=%cd`).toString().trim();
    return { authors, lastUpdate };
  }

}




module.exports = {
  ProjectIndexer: new ProjectIndexer(),
}