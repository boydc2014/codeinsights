const { SolutionIndexer } = require('./SolutionIndexer');
const { ProjectIndexer } = require('./ProjectIndexer');
const { FileProcesser } = require('../utils/fileUtil');
const { path } = require('../utils/pathUtil');

const index = (rootDir) => {
  const indexJson = {
    name: path.basename(rootDir),
    path: rootDir,
    solutions: [],
    projects: []
  }

  console.log("Begin indexing... ")
  console.time("Time");

  const slnFiles = FileProcesser.glob(rootDir, ".sln");
  console.log(`${slnFiles.length} solution files found.`)
  slnFiles.map(slnFile => {
    console.log(`\t Indexing ${slnFile}`)
    indexJson.solutions.push(SolutionIndexer.index(slnFile));
  });

  const projFiles = FileProcesser.glob(rootDir, ".csproj");
  console.log(`${projFiles.length} project files found.`)
  indexJson.projects = ProjectIndexer.indexProjects(projFiles);

  console.log("Indexing Done.");
  console.timeEnd("Time");
  /*
  const slnFiles = SolutionIndexer.getSlnFiles(rootDir);
  console.log(`${slnFiles.length} solution files found`);

  indexJson.solutions = slnFiles;
  slnFiles.forEach((s, index) => {
    const projects = SolutionIndexer.getProjectsFromSlnFile(s.path);
    indexJson.solutions[index].projects = projects;
  })

  //initial three variables defined in ./${rootDir}/Directory.Build.props
  const initialProperties = {
    "IbizaExtensionVersion": "1.4.1.x",
    "IntercomWebUIVersion": "1.6.20-92600",
    "IntercomClientWebUIVersion": "1.1.30-107739",
    "IntercomBotAppTemplatesVersion": "1.3.27-92712",
  }
  for (let i = 0; i < indexJson.solutions.length; i++) {
    const projects = indexJson.solutions[i].projects || [];
    console.log(`indexing ${i + 1}: ${indexJson.solutions[i].path}`)
    for (let j = 0; j < projects.length; j++) {
      const project = projects[j];
      //ignore non csproject at this moment
      //if (project.type === 'csharp') {
      console.log("   ", `project ${project.path}`)
      try {
        let importProperties = ProjectIndexer.getImportsProperties(project);
        importProperties = Object.assign(importProperties, initialProperties);
        indexJson.solutions[i].projects[j].packages = ProjectIndexer.getPackageReferences(project, importProperties);
        console.log("       ", `${indexJson.solutions[i].projects[j].packages.length} package reference found`);
        indexJson.solutions[i].projects[j].references = ProjectIndexer.getProjectReferences(project);
        console.log("       ", `${indexJson.solutions[i].projects[j].references.length} reference projects found`);
        indexJson.solutions[i].projects[j].targetFrameworks = ProjectIndexer.getTargetFramework(project, importProperties);
        console.log("       ", `target framework is ${indexJson.solutions[i].projects[j].targetFrameworks}`);
        const { fileCount, lineCount } = ProjectIndexer.getProjectFiles(project);
        indexJson.solutions[i].projects[j].fileCount = fileCount;
        console.log("       ", `${indexJson.solutions[i].projects[j].fileCount} files found`);
        indexJson.solutions[i].projects[j].lineCount = lineCount;
        console.log("       ", `${indexJson.solutions[i].projects[j].lineCount} lines of code`);
        const { authors, lastUpdateTime } = ProjectIndexer.getProjectGitInfo(project);
        indexJson.solutions[i].projects[j].authors = authors;
        indexJson.solutions[i].projects[j].lastUpdateTime = lastUpdateTime;
        console.log("       ", `${authors}`);
        console.log("       ", `${lastUpdateTime}`);
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
  */
  return indexJson;
}

module.exports = {
  index
}
