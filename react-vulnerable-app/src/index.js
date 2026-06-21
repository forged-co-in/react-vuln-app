import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

// Global variable leak
window.GLOBAL_APP_VERSION = "1.0.0-beta";
window.debugMode = true;

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);

// Expose internals for debugging
window.__REACT_APP_INTERNALS = {
  version: GLOBAL_APP_VERSION,
  env: process.env
};
