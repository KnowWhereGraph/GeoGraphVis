import 'semantic-ui-css/semantic.min.css';
import './css/index.css';
import './css/App.css';

import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import reportWebVitals from './reportWebVitals';

import ReactGA from 'react-ga4';
ReactGA.initialize('G-WXKLJPZB8K');
ReactGA.send("pageview");

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
