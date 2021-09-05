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

  // Index solutions first
  const slnFiles = FileProcesser.glob(rootDir, ".sln");
  console.log(`${slnFiles.length} solution files found.`)
  slnFiles.map(slnFile => {
    console.log(`\t Indexing ${path.relative(rootDir, slnFile)}`)
    indexJson.solutions.push(SolutionIndexer.index(slnFile));
  });

  // Index projects second
  projectIndexer = new ProjectIndexer(rootDir);
  const projFiles = FileProcesser.glob(rootDir, ".csproj");
  console.log(`${projFiles.length} project files found.`)
  indexJson.projects = projectIndexer.indexProjects(projFiles);

  // CrossIndex solutions <-> projects at end
  indexJson.solutions.forEach(solution => {
    solution.projects.forEach(project => {
      const index = indexJson.projects.findIndex(p => p.path == project);
      if (index !== -1) {
        indexJson.projects[index].containedBy.push(solution.path);
      } else {
        console.log(`[WARN]: solution ${solution.path} contains non-existing project ${project}.`);
      }
    })
  })

  console.log("Indexing Done.");
  console.timeEnd("Time");

  return indexJson;
}

module.exports = {
  index
}
