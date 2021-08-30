const { FileProcesser } = require('../utils/fileUtil');
const path = require('path');


const projectTypes = {
  "{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}": "csharp",
  "{9A19103F-16F7-4668-BE54-9A1E7A4F7556}": "csharp",
  "{2150E333-8FDC-42A3-9474-1A3956D46DE8}": "solutionFolder",
}

class SolutionIndexer {

  getSlnFiles = (rootDir) => {
    const slnFiles = [];
    const getFiles = (rootDir, slnFiles) => {
      const files = FileProcesser.readdirSync(rootDir);
      files.forEach((f) => {
        const filePath = path.resolve(rootDir, f);
        const fileStat = FileProcesser.statSync(filePath);
        if (fileStat.isDirectory()) {
          getFiles(filePath, slnFiles);
        } else if (f.endsWith('.sln')) {
          slnFiles.push({
            name: f,
            path: filePath,
          });
        }
      });
    }
    getFiles(rootDir, slnFiles);
    return slnFiles;
  }


  getProjectsFromSlnFile = (slnFile) => {
    const projectDir = path.dirname(slnFile);
    const lines = FileProcesser.readFileLines(slnFile);
    const projectLines = lines.filter((l) => l.startsWith('Project'));
    const projects = [];
    projectLines.forEach((p) => {
      const tokens = (p.split(',').map((l) => {
        return l.trim();
      }));
      const projectDescription = tokens[0].split('"');
      const projectRelativePath = tokens[1].substring(1, tokens[1].length - 1);
      //only collect csharp project
      if (projectTypes[projectDescription[1]] === 'csharp') {
        projects.push({
          name: projectDescription[projectDescription.length - 2],
          path: path.resolve(projectDir, projectRelativePath),
          // type: projectTypes[projectDescription[1]] || 'unknown',
        });
      }

    })
    return projects;
  }
}

module.exports = {
  SolutionIndexer: new SolutionIndexer(),
}