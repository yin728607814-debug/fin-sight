import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import './utils/emergencyRecovery'; // 加载紧急恢复工具
import './utils/emergencyRecovery'; // 加载紧急恢复工具

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);