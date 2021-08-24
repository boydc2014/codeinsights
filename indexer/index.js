const fs = require('fs');
const path = require('path');

const rootDir = process.argv[2];

if (!rootDir) {
  throw Error('format: node index.js {project path}');
}

const indexJson = {
  name: "Intercom",
  path: rootDir,
  solutions: []
}

const getSlnFiles = (rootDir) => {
  const slnFiles = [];
  const getFiles = (rootDir, slnFiles) => {
    const files = fs.readdirSync(rootDir);
    files.forEach((f) => {
      const filePath = path.resolve(rootDir, f);
      const fileStat = fs.statSync(filePath);
      if (fileStat.isDirectory()) {
        getFiles(filePath, slnFiles);
      } else if (f.endsWith('.sln')) {
        slnFiles.push(filePath);
        indexJson.solutions.push({
          name: f,
          path: filePath,
          projects: []
        })
      }
    });
  }
  getFiles(rootDir, slnFiles);
  return slnFiles;
}

const slnFiles = getSlnFiles(rootDir);

const getProjectsFromSlnFile = (slnFile) => {
  const projectDir = path.dirname(slnFile);
  const data = fs.readFileSync(slnFile, "utf8");
  const lines = data.split('\r\n');
  const projectLines = lines.filter((l) => l.startsWith('Project'));
  const csprojects = [];
  const otherProjects = [];
  projectLines.forEach((p) => {
    const tokens = (p.split(',').map((l) => {
      return l.trim();
    }));

    const projectDescription = tokens[0].split('"');
    const projectRelativePath = tokens[1].substring(1, tokens[1].length - 1);
    if (tokens[1].endsWith('.csproj"')) {
      csprojects.push({
        name: projectDescription[projectDescription.length - 2],
        path: projectDir + '\\' + projectRelativePath,
      });
    } else {
      otherProjects.push({
        name: projectDescription[projectDescription.length - 2],
        path: projectDir + '\\' + projectRelativePath,
      });
    }
  })
  return { csprojects, otherProjects };
}

slnFiles.forEach((s, index) => {
  const { csprojects, otherProjects } = getProjectsFromSlnFile(s);
  indexJson.solutions[index].projects = [...csprojects, ...otherProjects];
})