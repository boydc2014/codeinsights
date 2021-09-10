import React, { useState, useMemo } from 'react';
import data from './data/repo.json';
import { ForceGraph } from "./components/forceGraph";
import FilterPanel from './components/filterPanel';
import './App.css';

const colors = ["#ed1299", "#09f9f5", "#246b93", "#cc8e12", "#d561dd", "#c93f00", "#ddd53e",
  "#4aef7b", "#e86502", "#9ed84e", "#39ba30", "#6ad157", "#8249aa", "#99db27", "#e07233", "#ff523f",
  "#ce2523", "#f7aa5d", "#cebb10", "#03827f", "#931635", "#373bbf", "#a1ce4c", "#ef3bb6", "#d66551",
  "#1a918f", "#ff66fc", "#2927c4", "#7149af", "#57e559", "#8e3af4", "#f9a270", "#22547f", "#db5e92",
  "#edd05e", "#6f25e8", "#0dbc21", "#280f7a", "#6373ed", "#5b910f", "#7b34c1", "#0cf29a", "#d80fc1",
  "#dd27ce", "#07a301", "#167275", "#391c82", "#2baeb5", "#925bea", "#63ff4f"]
const sharedProjectColor = 'black';

const generateGraphData = (projects) => {
  const pathIndexMap = {};
  const nodes = [];
  const links = [];
  const nodeGroup = {};
  const projectReferredTimes = {};
  let groupSize = 0;
  let maxlineCount = 0;
  for (let i = 0; i < projects.length; i++) {
    if (pathIndexMap[projects[i].path]) {
      console.log('Error: duplicated cs project');
      console.log(projects[i]);
    }
    pathIndexMap[projects[i].path] = i;
    if (!nodeGroup[projects[i].relativePath.split('/')[0]]) {
      nodeGroup[projects[i].relativePath.split('/')[0]] = groupSize;
      groupSize++;
    }
    maxlineCount = Math.max(maxlineCount, projects[i].lineCount)
  }
  for (let i = 0; i < projects.length; i++) {
    const project = projects[i];
    const refers = project.refers;
    const groupId = nodeGroup[projects[i].relativePath.split('/')[0]];
    const size = project.lineCount / maxlineCount;
    nodes.push({ id: i, groupId, color: colors[groupId % colors.length], size, path: project.path, adjNodes: [] });
    for (let j = 0; j < refers.length; j++) {
      const source = i;
      const target = pathIndexMap[refers[j]];
      if (!target) {
        console.log('Warn: project is not recorded');
        console.log('This is within expectation since some projects do refer a non-exist project')
      } else {
        links.push({ source, target })
        nodes[i].adjNodes.push(target);
      }

      if (!projectReferredTimes[refers[j]]) {
        projectReferredTimes[refers[j]] = 1;
      } else {
        projectReferredTimes[refers[j]] = projectReferredTimes[refers[j]] + 1;
      }
    }
  }

  for (let i = 0; i < projects.length; i++) {
    const project = projects[i];
    if (projectReferredTimes[project.path] > 1) {
      nodes[i].color = sharedProjectColor;
    }
  }
  return { nodes, links }
}


function App() {
  const [hoveredProjectPath, setHoveredProjectPath] = useState('');
  const [subGraph, setSubGraph] = useState(() => generateGraphData(data.projects));
  const graph = useMemo(() => {
    return generateGraphData(data.projects)
  }, []);



  const nodeHover = (projPath) => {
    setHoveredProjectPath(projPath);
  };

  const nodeClick = (clicked) => {
    const projects = data.projects;
    const clickedProject = projects.find((p) => p.path === clicked.path)
    const visited = [];
    const dfs = (project) => {
      if (!project) {
        console.log('[WARN] project does not exist', project);
        return
      }
      if (visited.find((v) => v.path === project.path)) {
        return;
      }
      visited.push(project);
      project.refers.forEach((r) => {
        const adjP = projects.find((p) => p.path === r);
        if (adjP) {
          dfs(adjP);
        }
      })
    }
    dfs(clickedProject);
    const g = generateGraphData(visited);
    setSubGraph(g);
  }

  const reset = () => {
    setSubGraph(graph);
  }

  const filter = (filterParameter) => {
    let projects = data.projects;

    if (filterParameter.solutionPath) {
      const solution = data.solutions.find((s) => s.path === filterParameter.solutionPath);
      if (solution) {
        projects = solution.projects.map((p) => projects.find((pp) => p === pp.path));
      }
    }

    if (filterParameter.projectPath) {
      projects = projects.filter(p => p.path === filter.projectPath);
    }

    if (filterParameter.alone) {
      projects = projects.filter(p => p.refers.length === 0 && p.referedBy.length === 0);
    }
    if (filterParameter.leaf) {
      projects = projects.filter(p => p.refers.length === 0 && p.referedBy.length > 0);
    }
    if (filterParameter.proxy) {
      projects = projects.filter(p => {
        const nonTestRefered = p.referedBy.filter(x => !(x.toLowerCase().includes("test.csproj") || x.toLowerCase().includes("tests.csproj")));
        return nonTestRefered.length === 1 && p.refers.length === 1;
      });
    }
    const g = generateGraphData(projects);
    setSubGraph(g);
  }

  return (
    <div className="App">
      <div className='graph'>
        <section className="Main">
          <ForceGraph linksData={subGraph.links} nodesData={subGraph.nodes} nodeHover={nodeHover} nodeClick={nodeClick} />
        </section>
      </div>
      <div className="InfoPanel">
        <FilterPanel filter={filter} reset={reset} />
        <div className="Info">hovered project path: {hoveredProjectPath} </div>
      </div>
    </div>
  );
}

export default App;
