// src/config/env.js
// 
// FOR LOCAL DEVELOPMENT:
//   Set to your computer's local IP (find with: ipconfig on Windows)
//   Example: http://192.168.178.72:8000
//
// FOR PRODUCTION (after Railway deploy):
//   Set to your Railway URL
//   Example: https://mul-salary-backend.up.railway.app

export const ENV = {
  BACKEND_URL: 'https://mul-salary-backend.up.railway.app', // <-- Update after Railway deploy
  API_BASE: 'https://mul-salary-backend.up.railway.app/api',
  APP_NAME: 'MUL Salary',
  VERSION: '1.0.0',
};
