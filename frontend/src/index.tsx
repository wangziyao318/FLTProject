import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// 添加科技感控制台提示
console.log('%c🚀 Powered by Future Tech', 'color: #5f9cf8; font-size: 14px; font-family: Orbitron, sans-serif;');

root.render(
  <React.StrictMode>
    <div className="tech-global-overlay">
      <App />
    </div>
  </React.StrictMode>
);

// 性能监测
reportWebVitals(console.log);