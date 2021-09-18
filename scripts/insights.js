const { path } = require('../utils/pathUtil');
const fs = require('fs');
const { exit } = require('process');
const { FileProcesser } = require('../utils/fileUtil');
const { formatDate } = require('../indexer/ProjectIndexer');

const indexesDir = path.join(__dirname, '..', 'indexes');

const getSubDirNames = (dir) => {
    return fs.readdirSync(dir);
}

const getIndexNames = () => {
    return getSubDirNames(indexesDir).filter(x => x !== "test");
}

const getDays = (timestamp) => {
    const parts = timestamp.split('-');
    return (parts[0] - 1970) * 365 + (parts[1] - 1) * 30 + parts[2] * 1;
}

const now = formatDate(new Date().getTime());

const loadIndex = () => {
    const indexNames = getIndexNames();
    if (indexNames.length == 0) {
        console.log("No indexes is found at ./indexes, did you forget to run 'node index.js <full path to repo>'? ");
        exit(1);
    }

    if (indexNames.length > 1) {
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
        question: "How many projects in the repo?",
        answer: (index) => {
            const testProjectsCount = index.projects.filter(p => p.isTest).length;
            return `Total projects:${index.projects.length}, in which ${testProjectsCount} are tests`;
        }
    },
    {
        question: "Which solution contains the most projects? ",
        answer: (i) => {
            const sortedSolutions = i.solutions.sort((a, b) => {
                return b.projects.length - a.projects.length;
            });

            let summary = "";
            for (let i = 0; i < sortedSolutions.length && i < 10; i++) {
                const message = `Top ${i + 1} Solution ${sortedSolutions[i].name} contains ${sortedSolutions[i].projects.length} projects at ${sortedSolutions[i].path}`;
                summary = summary.length == 0 ? message : summary + "\r\n   " + message;
            }
            return summary;
        }
    },
    {
        question: "How many projects refers to other projects? Which one refers to most projects?",
        answer: (index) => {
            const projectHasRefers = index.projects.filter(p => p.refers.length > 0);

            let projectHasMostRefers = projectHasRefers[0];
            projectHasRefers.forEach(p => {
                if (p.refers.length > projectHasMostRefers.refers.length) {
                    projectHasMostRefers = p;
                }
            })
            return `${projectHasRefers.length} projects refers to other projects, ${projectHasMostRefers.name} at ${projectHasMostRefers.path} refers to most ${projectHasMostRefers.refers.length} projects`;
        }
    },
    {
        question: "How many projects are refered by other projects? Which one is refered by the most projects?",
        answer: (index) => {
            const projectHasRefered = index.projects.filter(p => p.referedBy.length > 0);

            let projectHasMostRefered = projectHasRefered[0];
            projectHasRefered.forEach(p => {
                if (p.referedBy.length > projectHasMostRefered.referedBy.length) {
                    projectHasMostRefered = p;
                }
            })
            return `${projectHasRefered.length} projects refered by other projects, ${projectHasMostRefered.name} at ${projectHasMostRefered.path} refered by most ${projectHasMostRefered.referedBy.length} projects`;
        }
    },
    {
        question: "How many projects are targeting netstandard? (means it must be a lib)",
        answer: (index) => {
            const projects = index.projects;
            const targetingNetStandard = projects.filter((p) => {
                return p.targetFrameworks && p.targetFrameworks.some((f) => {
                    return f.includes('netstandard');
                })
            })
            return `${targetingNetStandard.length} projects are targeting netstandard`;
        }
    },
    {
        question: "How many/What are the leaf projects?",
        answer: (index) => {
            const projects = index.projects.filter(p => p.refers.length === 0 && p.referedBy.length > 0);
            return projects.map(p => p.path);
        }
    },
    {
        question: "How many/What are the standalone projects?",
        answer: (index) => {
            const projects = index.projects.filter(p => p.refers.length === 0 && p.referedBy.length == 0);
            return projects.map(p => p.path);
        }
    },
    {
        question: "How many/What are the projects are only used by one project except tests project (indicating a possible merge)? ",
        answer: (index) => {
            const aloneProjects = index.projects.filter(p => {
                const nonTestRefered = p.referedBy.filter(x => !(x.toLowerCase().includes("test.csproj") || x.toLowerCase().includes("tests.csproj")));
                return nonTestRefered.length === 1;
            });

            return aloneProjects.map(p => p.path);
        }
    },
    {
        question: "How many/What are the alone and a leaf (indicating high chance to merge)?  ",
        answer: (index) => {
            const aloneLeafProjects = index.projects.filter(p => {
                const nonTestRefered = p.referedBy.filter(x => !(x.toLowerCase().includes("test.csproj") || x.toLowerCase().includes("tests.csproj")));
                return nonTestRefered.length === 1 && p.refers.length === 0;
            });

            return aloneLeafProjects.map(p => p.path);
        }
    },
    {
        question: "How many/What are the proxy projects, used by one and use one ",
        answer: (index) => {
            const proxyProjects = index.projects.filter(p => {
                const nonTestRefered = p.referedBy.filter(x => !(x.toLowerCase().includes("test.csproj") || x.toLowerCase().includes("tests.csproj")));
                return nonTestRefered.length === 1 && p.refers.length === 1;
            });
            return proxyProjects.map(p => p.path);
        }
    },
    {
        question: "How many projects havn't been updated in last 0.5 years?",
        answer: (index) => {
            const results = index.projects.filter((p) => {
                return getDays(now) - getDays(p.lastUpdateTime) > 182;
            }).map((p) => p.path);
            return results;
        }
    },
    {
        question: "How many projects havn't been updated in last 1 years?",
        answer: (index) => {
            const results = index.projects.filter((p) => {
                return getDays(now) - getDays(p.lastUpdateTime) > 365;
            }).map((p) => p.path);
            return results;
        }
    },
    {
        question: "How many/what are the projects only have 1 author in last 2 years?",
        answer: (index) => {
            const results = index.projects.filter((p) => {
                return getDays(now) - getDays(p.lastUpdateTime) > 2 * 365;
            }).map((p) => p.path);
            return results;
        }
    },
    {
        question: "How many/what are the projects not included in solutions?",
        answer: (index) => {
            const results = index.projects.filter((p) => {
                return p.containedBy.length == 0
            }).map((p) => p.path);
            return results;
        }
    },
    {
        question: "How many/what are the projects not included in build?",
        answer: (index) => {
            const results = index.projects.filter((p) => {
                return p.inBuild == 'no'
            }).map((p) => p.path);
            return results;
        }
    }
]


const statics = {}

QAs.forEach(qa => {
    if (qa.skip) return;
    console.log(`Q: ${qa.question}`);
    const answer = qa.answer(index);
    console.log(`A: ${answer}`);
    statics[qa.question] = answer;
});
console.log(`statics data write to ${path.resolve(__dirname, './statics.txt')}`);
FileProcesser.writeFileSync('./statics.txt', statics);

