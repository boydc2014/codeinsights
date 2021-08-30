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
        indexJson.solutions[i].projects[j].targetFrameworks = ProjectIndexer.getTargetFramework(project);
        console.log("       ", `target framework is ${indexJson.solutions[i].projects[j].targetFrameworks}`);
        const { fileCount, lineCount } = ProjectIndexer.getProjectFiles(project);
        indexJson.solutions[i].projects[j].fileCount = fileCount;
        console.log("       ", `${indexJson.solutions[i].projects[j].fileCount} files found`);
        indexJson.solutions[i].projects[j].lineCount = lineCount;
        console.log("       ", `${indexJson.solutions[i].projects[j].lineCount} lines of code`);
        const { authors, lastUpdate } = ProjectIndexer.getProjectGitInfo(project);
        indexJson.solutions[i].projects[j].authors = authors;
        indexJson.solutions[i].projects[j].lastUpdate = lastUpdate;
        console.log("       ", `${authors}`);
        console.log("       ", `${lastUpdate}`);
      } catch (e) {
        //
        if (FileProcesser.existsSync(indexJson.solutions[i].projects[j].path)) {
          console.log(e)
        } else {
          console.log("       ", `project: ${project.path} does not exist`);
          indexJson.solutions[i].projects[j].notExist = true;
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
