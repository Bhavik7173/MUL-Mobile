// src/config/env.js
// Update BACKEND_URL to your deployed FastAPI server address
// For local development: use your computer's IP address (not localhost)
// Example: http://192.168.1.10:8000  (find your IP with: ipconfig / ifconfig)
// For production: https://your-api.railway.app

export const ENV = {
  BACKEND_URL: 'http://192.168.178.72:8000', // <-- Change this to your FastAPI server IP
  API_BASE: 'http://192.168.178.72:8000/api',
  APP_NAME: 'MUL Salary',
  VERSION: '1.0.0',
};
