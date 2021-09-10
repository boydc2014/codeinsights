import React, { useState } from 'react';
import './filterPanel.css';


export default function FilterPanel({ filter, reset }) {
  const [filterParameter, setFilter] = useState({
    projectPath: "",
    solutionPath: "",
    alone: false,
    leaf: false,
    proxy: false,
  })

  const resetFilter = () => {
    setFilter({
      projectPath: "",
      solutionPath: "",
      alone: false,
      leaf: false,
      proxy: false,
    });
    reset();
  }

  const handleOnChangeProjectPath = (projectPath) => {
    setFilter({ ...filterParameter, projectPath: projectPath });
    filter({ ...filterParameter, projectPath: projectPath });
  }

  const handleOnChangeSolutionPath = (solutionPath) => {
    setFilter({ ...filterParameter, solutionPath: solutionPath });
    filter({ ...filterParameter, solutionPath: solutionPath });
  }

  return (
    <div className='filterPanel'>
      {"project path: "}<input type="text" defaultValue={filterParameter.projectPath} onChange={(e) => handleOnChangeProjectPath(e.target.value)} />
      {"solution path: "}<input type="text" defaultValue={filterParameter.solutionPath} onChange={(e) => handleOnChangeSolutionPath(e.target.value)} />
      <p>
        <input type="button" id="reset" value="reset" onClick={(e) => resetFilter()} />
      </p>
      <p>
        <input type="checkbox" id="cbox1" checked={filterParameter.alone} onChange={(e) => {
          setFilter({ ...filterParameter, alone: !filterParameter.alone });
          filter({ ...filterParameter, alone: !filterParameter.alone })
        }} />
        <label>alone</label>
      </p>
      <p>
        <input type="checkbox" id="cbox2" checked={filterParameter.leaf} onChange={(e) => {
          setFilter({ ...filterParameter, leaf: !filterParameter.leaf });
          filter({ ...filterParameter, leaf: !filterParameter.leaf })
        }} />
        <label >leaf</label>
      </p>
      <p>
        <input type="checkbox" id="cbox3" checked={filterParameter.proxy} onChange={(e) => {
          setFilter({ ...filterParameter, proxy: !filterParameter.proxy });
          filter({ ...filterParameter, proxy: !filterParameter.proxy })
        }} />
        <label >proxy</label>
      </p>

    </div>
  )
}