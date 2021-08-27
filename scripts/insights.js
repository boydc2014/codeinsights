const path = require('path');
const fs = require('fs');
const { exit } = require('process');

const indexesDir = path.join(__dirname, '..', 'indexes');

const getSubDirNames = (dir) => {
    return fs.readdirSync(dir);
}

const getIndexNames = () => 
{
    return getSubDirNames(indexesDir).filter(x => x !== "test");
}

var loadIndex = () =>
{
    const indexNames = getIndexNames();
    if (indexNames.length == 0) {
        console.log("No indexes is found at ./indexes, did you forget to run 'node index.js <full path to repo>'? ");
        exit(1);
    }

    if (indexNames.length > 1)
    {
        console.log(`Mulitple indexes are found in ./indexes, but we only load the first one ${indexNames[0]}`);
    }
    
    const indexPath = path.join(indexesDir, indexNames[0], 'repo.json');
    if (!fs.existsSync(indexPath)) {
        console.log(`No index file found at ${indexPath}, abort`);
        exit(1);
    }

    console.log(`Loading index from ${indexPath}`);
    return JSON.parse(fs.readFileSync(indexPath));
}

const index = loadIndex();

console.log("Index loaded. ");

const QAs = [
    {
        question: "How many solutions files in the repo? ",
        answer: (index) => { return index.solutions.length; }
    },
    {
        question: "How many projects in the repo? How many c# projects?",
        answer: (index) => {
            const projects = index.solutions.flatMap(x => x.projects);
            const csProjects = projects.filter(p => p.type == 'csProject');
            return `Total projects:${projects.length}, csharp projects: ${csProjects.length}`;
        }
    },
    {
        question: "Which solution contains the most projects? ",
        answer: (i) => {
            const sortedSolutions = i.solutions.sort((a, b) => {
                return b.projects.filter(p => p.type == 'csProject').length - a.projects.filter(p => p.type == 'csProject').length;
            });
            const top = sortedSolutions[0];
            return `Solution ${top.name} contains ${top.projects.filter(p => p.type == 'csProject').length} c# projects at ${top.path}`;
        }
    }
]

QAs.forEach(qa => 
{
    console.log(`Q: ${qa.question}`);
    console.log(`A: ${qa.answer(index)}`);
});

