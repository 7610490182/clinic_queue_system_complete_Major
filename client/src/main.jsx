import React from 'react'
import ReactDOM from 'react-dom/client'
import axios from 'axios'
import App from './App.jsx'
import './index.css'
import { getApiUrl } from './config.js'

// Configure axios base URL dynamically for both localhost and production
axios.defaults.baseURL = getApiUrl();

// Global Axios Request Interceptor: Ensures every outgoing API call automatically carries
// the authenticated user Bearer token without racing against component lifecycle
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
