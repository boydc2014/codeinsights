import React, { useEffect, useRef, useState } from 'react';
import { Text } from '@fluentui/react/lib/Text';
import { useRecoilState } from 'recoil';
import { SearchBox } from '@fluentui/react/lib/SearchBox';

import { selectedNodeState } from '../recoil/atoms';
import data from '../data/repo.json';
/*******************style*********************/
const sideContainerStyle = {
    boxShadow: '2px 0px 2px #aaa',
    position: 'absolute',
    height: '100%',
    width: '400px',
    overflow: 'auto',
}

const projectItemStyle = (active) => {
    return {
        height: '40px',
        borderTop: '1px solid #eee',
        lineHeight: '40px',
        paddingLeft: '10px',
        background: active ? '#eee' : '#fff'
    }
}
/*******************style*********************/

const projects = data.projects;

const ListItem = ({data}) => {
    const [selected, setSelected] = useRecoilState(selectedNodeState);
    const liRef = useRef(null);
    useEffect(() => {
        if(selected && data.path === selected.path) {
            setTimeout(() => {
                liRef.current.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                });
            }, 200);
        }
    }, [selected, data])
    return (
        <li 
            key={data.path} 
            ref={liRef}
            style={projectItemStyle(selected && data.path === selected.path)} 
            onClick={() => {setSelected(data)}}>
                <Text block>{data.name}</Text>
        </li>
    )
}
const SideBar = () => {
    const [items, setItems] = useState(projects);
    return (
        <div style={sideContainerStyle}>
            <SearchBox placeholder="Search Project" onChange={(event) => {
                if(event && event.target) {
                    setItems(projects.filter((item) => item.name.startsWith(event.target.value)));
                } else {
                    setItems(projects);
                }
            }}/>
            <ul style={{ margin: 10, padding: 0 }}>
                {
                    items.map((item) => {
                        return (
                            <ListItem key={item.path} data={item}/>
                        )
                    })
                }
            </ul>
        </div>
      )
}

export default SideBar;