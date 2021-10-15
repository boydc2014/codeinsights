import React, { useEffect, useState, useRef } from 'react';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { Canvas, Node } from 'reaflow';
import { Label } from '@fluentui/react/lib/Label';
import { TooltipHost } from '@fluentui/react/lib/Tooltip';
import { Text } from '@fluentui/react/lib/Text';

import data from '../data/repo.json';
import { selectedNodeState } from '../recoil/atoms';

/*******************style*********************/
const nodeStyle = {
    color: '#fff', 
    cursor: 'pointer', 
    height: '100%',
    width: '100%',
    lineHeight: '32px',
    textAlign: 'center',
}

const mainContainer = {
    position: 'absolute', 
    top: 0, 
    bottom: 0, 
    left: '400px', 
    right: 0
}

/*******************style*********************/

const searchNodeInfo = (path) => {
    return data.projects.find((item) => item.path === path);
}

const createNode = (path) => {
    return {
        id: path,
        height: 32,
        width: 320,
        ports: [
            {id: `${path}-e`, side: 'EAST'},
            {id: `${path}-w`, side: 'WEST'}
        ],
        data: searchNodeInfo(path)
      }
}

const createEdge = (source, target) => {
    return {
        id: `${source}-${target}`,
        from: source,
        to: target,
        fromPort: `${source}-e`,
        toPort: `${target}-w`
    }
}

const createCircleEdge = (source, target) => {
    return {
        id: `${source}-${target}`,
        from: source,
        to: target,
        fromPort: `${source}-w`,
        toPort: `${target}-e`
    }
}

const findCircle = (refers, referedBy) => {
    const circles = [];
    const filteredReferedBy = [];
    const map = {};
    for(let refer of refers) {
        map[refer] = true;
    }

    for(let item of referedBy) {
        if(map[item]) {
            circles.push(item)
        } else {
            filteredReferedBy.push(item)
        }
    }

    return {circles, filteredReferedBy}
}

const createNodes = (selected) => {
    if(!selected) return { nodes:[], edges:[] };
    const single = searchNodeInfo(selected.path);
    const refers = Array.from(new Set(single.refers));
    const referedBy = Array.from(new Set(single.referedBy));
    const {circles, filteredReferedBy} = findCircle(refers, referedBy);
    const projects = [...refers, single.path, ...filteredReferedBy];
    const nodes = projects.map(item => createNode(item));
    const edges = refers.map(item => createEdge(item, single.path));
    edges.push(...filteredReferedBy.map(item => createEdge(single.path, item)));
    //contain circle
    edges.push(...circles.map(item => createCircleEdge(item, single.path)));
    return { nodes, edges };
}

const tooltipProps = (value) => {
    const {name, path, containedBy, fileCount, lineCount, lastUpdateTime} = value;
    const labels= ['name', 'path', 'contained by', 'file count', 'line count', 'last update time'];
    const list = [name, path, containedBy, fileCount, lineCount, lastUpdateTime];
    return {
        onRenderContent: () => (
            <ul style={{ margin: 10, padding: 0 }}>
                {
                    labels.map((item, index) => {
                        return (<li key={item}>
                            <Label>{item}</Label>
                            <Text block>{list[index] || ''}</Text>
                        </li>)
                    })
                }
            </ul>
        ),
    }
};

const CustomNode = () => {
    const setSelected = useSetRecoilState(selectedNodeState);
    return (
        <Node>
            {
                event => (
                    <foreignObject 
                        height={event.height} 
                        width={event.width} 
                        x={0}
                        y={0}
                        onClick={() => {setSelected(event.node.data)}}
                    >
                        <TooltipHost tooltipProps={tooltipProps(event.node.data)} >
                            <div style={nodeStyle}>
                                {event.node.data.name}
                            </div>
                        </TooltipHost>
                    </foreignObject>
                )
            }
        </Node>
    )
}
const ProjectCanvas = () => {
    const selected = useRecoilValue(selectedNodeState);
    const canvasRef = useRef(null);
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    useEffect(() => {
        const result = createNodes(selected);
        setNodes(result.nodes);
        setEdges(result.edges);
        if(canvasRef.current) {
            canvasRef.current.centerCanvas();
        }
    }, [selected])
    return (
        <div style={mainContainer}>
            <Canvas
                ref={canvasRef}
                direction='RIGHT'
                fit={true}
                readonly={true}
                nodes={nodes}
                edges={edges}
                node = {CustomNode()}
            />
        </div>
      )
}

export default ProjectCanvas;