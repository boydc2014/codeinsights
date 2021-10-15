import React from 'react';
import { RecoilRoot } from 'recoil';
import ReactDOM from 'react-dom';
import { initializeIcons } from '@fluentui/react/lib/Icons';

import DetailPage from './page/DetailPage';
import App from './App';

import './index.css';

initializeIcons(/* optional base url */);

ReactDOM.render(
  <React.StrictMode>
    <RecoilRoot>
      <DetailPage />
    </RecoilRoot>
  </React.StrictMode>,
  document.getElementById('root')
);