import React from 'react';
import ProjectCanvas from './ProjectCanvas';
import SideBar from './SideBar';

/*******************style*********************/
const rootStyle = {

}

/*******************style*********************/
const DetailPage = () => {
    return (
        <div style={rootStyle}>
            <SideBar/>
            <ProjectCanvas />
        </div>
      )
}

export default DetailPage;