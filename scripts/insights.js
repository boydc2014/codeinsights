const { path } = require('../utils/pathUtil');
const fs = require('fs');
const { exit } = require('process');
const { FileProcesser } = require('../utils/fileUtil');
const { ProjectIndexer } = require('../indexer/ProjectIndexer');

const indexesDir = path.join(__dirname, '..', 'indexes');

const getSubDirNames = (dir) => {
    return fs.readdirSync(dir);
}

const getIndexNames = () => {
    return getSubDirNames(indexesDir).filter(x => x !== "test");
}

var loadIndex = () => {
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


// Build a project-keyed index based on the orignial solution-keyed index
// Maybe we should consider build directly a project-keyed index at the first place
var reverseIndex = (index) => {
    var projects = {};

    // Iterate every project in every solution
    index.solutions.forEach(s => {
        const sid = path.relative(index.path, s.path);
        s.projects.forEach(p => {
            const pid = path.relative(index.path, p.path);

            if (!(pid in projects))
            {
                projects[pid] = {
                    id: pid,
                    solutions: [sid]
                }
            }
            else {
                projects[pid].solutions.push(sid);
            }
        })
    });
    
    return projects;
}

const index = loadIndex();
console.log("Index loaded. ");

const rIndex = reverseIndex(index);
FileProcesser.writeFileSync("./projects.json", rIndex);
console.log("Reverse index generated and saved to ./projects.json. ");

const QAs = [
    {
        question: "How many solutions files in the repo? ",
        answer: (index) => { return index.solutions.length; }
    },
    {
        question: "How many projects in the repo?",
        //这里的projects统计的都是从sln文件引入的，还有不少projects是其他csproj refer的还未计算
        answer: (index, rIndex) => {
            return `Total projects:${Object.keys(rIndex).length}`;
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
        question: "How many projects are testing (usually ends with .Tests?)",
        answer: (index) => {
            const projects = index.solutions.flatMap(x => x.projects);
            const length = projects.filter((p) => {
                return p.name.toLowerCase().includes('test');
            }).length;
            return `Total Test projects:${length}`;
        },
    },
    {
        question: "How many projects refers to other projects? Which one refers to most projects?",
        answer: (index) => {
            const projects = index.solutions.flatMap(x => x.projects);
            let mostDependOnOther = projects[0];
            const dependOnOther = projects.filter((p) => {
                if (p.references && p.references.length > mostDependOnOther.references.length) {
                    mostDependOnOther = p;
                }
                return p.references && p.references.length > 0;
            });
            return `${dependOnOther.length} projects refers to other projects, ${mostDependOnOther.path} refers to most projects`;
        }
    },
    {
        question: "How many projects are refered by other projects? Which one is refered by the most projects?",
        answer: (index) => {
            const obj = {};
            const projects = index.solutions.flatMap(x => x.projects);
            projects.forEach((p) => {
                if (p.references && p.references.length > 0) {
                    p.references.forEach((r) => {
                        if (!obj[r]) {
                            obj[r] = 1;
                        } else {
                            obj[r] = obj[r] + 1;
                        }
                    })
                }
            });
            let mostReferred = -1;
            let p = null;
            Object.keys(obj).forEach((k) => {
                if (obj[k] > mostReferred) {
                    p = k;
                    mostReferred = obj[k];
                }
            })
            return `${Object.keys(obj).length} projects are refered by other projects, ${p} is referred by the most projects`;
        }
    },
    {
        question: "How many projects are targeting netstandard? (means it must be a lib)",
        answer: (index) => {
            const projects = index.solutions.flatMap(x => x.projects);
            const targetingNetStandard = projects.filter((p) => {
                return p.targetFrameworks && p.targetFrameworks.some((f) => {
                    return f.includes('netstandard');
                })
            })
            return `${targetingNetStandard.length} projects are targeting netstandard`;
        }
    },
    {
        question: "How many/What are the single projects (only dependented by others)? ",
        answer: (index) => {
            const projects = index.solutions.flatMap(x => x.projects);
            const obj = {};
            projects.forEach((p) => {
                if (p.references && p.references.length > 0) {
                    p.references.forEach((r) => {
                        if (!obj[r]) {
                            obj[r] = 1;
                        } else {
                            obj[r] = obj[r] + 1;
                        }
                    })
                }
            });

            const singleProjects = projects.filter((p) => {
                return (!p.references || p.references.length === 0) && !obj[p.path]
            }).map((s) => s.path);
            return singleProjects;
        }
    },
    {
        question: "How many/What are the alone leafs, alone used by one project except tests project? ",
        answer: (index) => {
            const projects = index.solutions.flatMap(x => x.projects);
            //非测试项目
            const nonTestProjects = projects.filter((p) => {
                return !p.name.toLowerCase().includes('test');
            });
            //被引用的统计
            const referredStatics = {};
            //统计所有非测试项目中引用其他项目的情况
            nonTestProjects.forEach((p) => {
                if (p.references && p.references.length > 0) {
                    p.references.forEach((r) => {
                        if (!referredStatics[r]) {
                            referredStatics[r] = 1;
                        } else {
                            referredStatics[r] = referredStatics[r] + 1;
                        }
                    })
                }
            });
            //被引用一次的项目
            const projectsReferredOnce = Object.keys(referredStatics).filter((key) => referredStatics[key] === 1);
            //被引用一次且不引用其他项目 且目前还存在
            const aloneProjects = projectsReferredOnce.filter((p) => {
                const index = nonTestProjects.findIndex((ntp) => ntp.path === p);
                if (index === -1) return true;
                return (!nonTestProjects[index].references || nonTestProjects[index].references.length === 0)
            }).filter(p => {
                return FileProcesser.existsSync(p); //一些引用的项目已经不存在了
            });
            //测试发现目前这样的项目都已经不存在了
            return aloneProjects;
        }
    },
    {
        question: "How many/What are the proxy node, used by one and use one ",
        answer: (index) => {
            const projects = index.solutions.flatMap(x => x.projects);
            //非测试项目
            const nonTestProjects = projects.filter((p) => {
                return !p.name.toLowerCase().includes('test');
            });
            //被引用的统计
            const referredStatics = {};
            //统计所有非测试项目中引用其他项目的情况
            nonTestProjects.forEach((p) => {
                if (p.references && p.references.length > 0) {
                    p.references.forEach((r) => {
                        if (!referredStatics[r]) {
                            referredStatics[r] = 1;
                        } else {
                            referredStatics[r] = referredStatics[r] + 1;
                        }
                    })
                }
            });
            //被引用一次的项目
            const projectsReferredOnce = Object.keys(referredStatics).filter((key) => referredStatics[key] === 1);
            //被引用一次且只引用一个项目 且目前还存在
            const proxyProjects = projectsReferredOnce.filter((p) => {
                const index = nonTestProjects.findIndex((ntp) => ntp.path === p);
                if (index === -1) return false;
                return (nonTestProjects[index].references && nonTestProjects[index].references.length === 1)
            });
            return proxyProjects;
        }
    },
    {
        question: "How many projects havn't been updated in last 0.5 years?",
        answer: (index) => {
            const dayDiff = (date1, date2) => {
                date1 = date1.split('-');
                date2 = date2.split('-');
                const day1 = (date1[0] - 1970) * 365 + (date1[1] - 1) * 30 + date1[2] * 1
                const day2 = (date2[0] - 1970) * 365 + (date2[1] - 1) * 30 + date2[2] * 1
                return day1 - day2;
            }
            const projects = index.solutions.flatMap(x => x.projects);
            const now = ProjectIndexer.formatDate(new Date().getTime());
            const halfYear = projects.filter((p) => {
                if (p.notExist) {
                    return false;
                }
                if (!p.lastUpdateTime) {
                    return false;
                }
                return dayDiff(now, p.lastUpdateTime) > 183
            }).map((p) => p.path);
            return halfYear
        }
    },
    {
        question: "How many projects havn't been updated in last 1 years?",
        answer: (index) => {
            const dayDiff = (date1, date2) => {
                date1 = date1.split('-');
                date2 = date2.split('-');
                const day1 = (date1[0] - 1970) * 365 + (date1[1] - 1) * 30 + date1[2] * 1
                const day2 = (date2[0] - 1970) * 365 + (date2[1] - 1) * 30 + date2[2] * 1
                return day1 - day2;
            }
            const projects = index.solutions.flatMap(x => x.projects);
            const now = ProjectIndexer.formatDate(new Date().getTime());
            const year = projects.filter((p) => {
                if (p.notExist) {
                    return false;
                }
                if (!p.lastUpdateTime) {
                    return false;
                }
                return dayDiff(now, p.lastUpdateTime) > 365
            }).map((p) => p.path);
            return year
        }
    },
    {
        question: "How many/what are the projects only have 1 author in last 2 years?",
        answer: (index) => {
            const now = new Date();
            const twoYearAgo = now.setFullYear(now.getFullYear() - 2);
            const formatDate = ProjectIndexer.formatDate(twoYearAgo);
            const projects = index.solutions.flatMap(x => x.projects);
            const needTransfer = projects.filter((p, index) => {
                console.log(projects.length, index);
                if (p.notExist) return false;
                return ProjectIndexer.getRecentAuthor(p, formatDate).length <= 1;
            }).map((p) => p.path);
            return needTransfer;
        }
    }
]


const statics = {}

QAs.slice(0, 2).forEach(qa => {
    console.log(`Q: ${qa.question}`);
    const answer = qa.answer(index, rIndex);
    console.log(`A: ${answer}`);
    statics[qa.question] = answer;
});
console.log(`statics data write to ${path.resolve(__dirname, './statics.txt')}`);
FileProcesser.writeFileSync('./statics.txt', statics);

