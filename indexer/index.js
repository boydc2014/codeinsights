const { SolutionIndexer } = require('./SolutionIndexer');
const { ProjectIndexer } = require('./ProjectIndexer');
const { FileProcesser } = require('../utils/fileUtil');

const index = (rootDir) => {
  const indexJson = {
    name: "Intercom",
    path: rootDir,
    solutions: []
  }

  const slnFiles = SolutionIndexer.getSlnFiles(rootDir);
  console.log(`${slnFiles.length} solution files found`);

  indexJson.solutions = slnFiles;
  slnFiles.forEach((s, index) => {
    const projects = SolutionIndexer.getProjectsFromSlnFile(s.path);
    indexJson.solutions[index].projects = projects;
  })

  for (let i = 0; i < indexJson.solutions.length; i++) {
    const projects = indexJson.solutions[i].projects || [];
    console.log(`indexing ${i + 1}: ${indexJson.solutions[i].path}`)
    for (let j = 0; j < projects.length; j++) {
      const project = projects[j];
      //ignore non csproject at this moment
      //if (project.type === 'csharp') {
      console.log("   ", `project ${project.path}`)
      try {
        indexJson.solutions[i].projects[j].packages = ProjectIndexer.getPackageReferences(project);
        console.log("       ", `${indexJson.solutions[i].projects[j].packages.length} package reference found`);
        indexJson.solutions[i].projects[j].references = ProjectIndexer.getProjectReferences(project);
        console.log("       ", `${indexJson.solutions[i].projects[j].references.length} reference projects found`);
        indexJson.solutions[i].projects[j].exist = true;
      } catch (e) {
        indexJson.solutions[i].projects[j].exist = false;
        if (FileProcesser.existsSync(indexJson.solutions[i].projects[j].path)) {
          console.log(e)
        } else {
          console.log("       ", `project: ${project.path} does not exist`);
        }
      }
      //}
    }
  }
  return indexJson;
}

module.exports = {
  index
}
