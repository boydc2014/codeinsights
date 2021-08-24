
// {
//   "name": "Intercom",
//   "path": "c:/intercom",
//   "solutions": [
//       {
//           "name": "TestBot.sln",
//           "path": "Intercom/Testbot.sln",
//           "projects": [
//               {
//                   "name": "TestBot",
//                   "path": "TestBot.csproj",
//                   "packages": [
//                       {
//                           "name": "Microsoft.ApplicationInsights",
//                           "version": "1.0.0"
//                       }
//                   ],
//                   "references": [
//                       {
//                           "path": "Intercom/Intercom.helpser.csproj"
//                       }
//                   ],
//                   "lastUpdate": "20210816",
//                   "authors": ["Zhixiang", "Dong"],
//                   "fileCount": "200",
//                   "lineCount": "20000",
//                   "targetFrameworks": [
//                       "netframework4.8",
//                       "netcore3.1"
//                   ]
//               }
//           ]
//       }
//   ]
// }

const fs = require('fs');
const path = require('path');
const rootDir = 'D:\\Intercom';
const indexJson = {
  name: "Intercom",
  path: 'D:\\Intercom',
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
    if (tokens[1].endsWith('.csproj"')) {
      csprojects.push({
        name: projectDescription[projectDescription.length - 2],
        path: tokens[1],
      });
    } else {
      otherProjects.push({
        name: projectDescription[projectDescription.length - 2],
        path: tokens[1],
      });
    }
  })
  return { csprojects, otherProjects };
}



slnFiles.forEach((s, index) => {
  const { csprojects, otherProjects } = getProjectsFromSlnFile(s);
  indexJson.solutions[index].projects = [...csprojects, ...otherProjects];
})

