import React from "react";
import { runForceGraph } from "./forceGraphGenerator";
import styles from "./forceGraph.module.css";

export function ForceGraph({ linksData, nodesData, nodeHover, nodeClick }) {
  const containerRef = React.useRef(null);

  React.useEffect(() => {
    let destroyFn;

    if (containerRef.current) {
      const { destroy } = runForceGraph(containerRef.current, linksData, nodesData, nodeHover, nodeClick);
      destroyFn = destroy;
    }

    return destroyFn;
  }, [linksData, nodesData]);

  return <div ref={containerRef} className={styles.container} />;
}
