const path = require('path');
const { readFileLines, readdirSync, statSync, writeFileSync, mkDirSync } = require('./util/fileUtil');
const { parse } = require('./pathParser');


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
    const files = readdirSync(rootDir);
    files.forEach((f) => {
      const filePath = path.resolve(rootDir, f);
      const fileStat = statSync(filePath);
      if (fileStat.isDirectory()) {
        getFiles(filePath, slnFiles);
      } else if (f.endsWith('.sln')) {
        slnFiles.push(filePath);
        indexJson.solutions.push({
          name: f,
          path: filePath,
        })
      }
    });
  }
  getFiles(rootDir, slnFiles);
  return slnFiles;
}

const getProjectsFromSlnFile = (slnFile) => {
  const projectDir = path.dirname(slnFile);
  const lines = readFileLines(slnFile);
  const projectLines = lines.filter((l) => l.startsWith('Project'));
  const csProjects = [];
  const otherProjects = [];
  projectLines.forEach((p) => {
    const tokens = (p.split(',').map((l) => {
      return l.trim();
    }));

    const projectDescription = tokens[0].split('"');
    const projectRelativePath = tokens[1].substring(1, tokens[1].length - 1);
    if (tokens[1].endsWith('.csproj"')) {
      csProjects.push({
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
  return { csProjects, otherProjects };
}

const generateProjectDetails = (solution, slnIndex) => {
  //ignore non csproj projects at this moment
  const projects = solution.csProjects || [];
  for (let i = 0; i < projects.length; i++) {
    const project = projects[i];
    if (project.path.endsWith('.csproj')) {
      try {
        indexJson.solutions[slnIndex].csProjects[i].packages = getProjectPackageReference(project);
        indexJson.solutions[slnIndex].csProjects[i].reference = getProjectImport(project);
      } catch (e) {
        indexJson.solutions[slnIndex].csProjects[i].error = e;
      }

    }
  }
}

const getProjectPackageReference = (project) => {
  const packages = [];
  const lines = readFileLines(project.path).map((l) => l.trim());
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

const getProjectImport = (project) => {
  const lines = readFileLines(project.path).map((l) => l.trim());
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

const slnFiles = getSlnFiles(rootDir);

slnFiles.forEach((s, index) => {
  const { csProjects, otherProjects } = getProjectsFromSlnFile(s);
  indexJson.solutions[index].csProjects = csProjects;
  indexJson.solutions[index].otherProjects = otherProjects;
})

// const intercomsln = indexJson.solutions[37];
// generateProjectDetails(intercomsln, 37);
for (let i = 0; i < indexJson.solutions.length; i++) {
  generateProjectDetails(indexJson.solutions[i], i);
}


let gitHead = readFileLines(`${rootDir}/.git/HEAD`)[0].split(' ')[1];
let hash = readFileLines(`${rootDir}/.git/${gitHead.substring(0, gitHead.length - 1)}`)[0];
hash = hash.substring(0, hash.length - 1);
mkDirSync(`./${hash}`)
writeFileSync(`./${hash}/data.json`, indexJson);
