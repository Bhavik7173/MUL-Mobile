# MUL Salary — Deployment Guide

## Step 1: Deploy Backend to Railway

1. Go to https://railway.app → sign up with GitHub
2. Push the `backend/` folder to GitHub:
   ```
   git init
   git add .
   git commit -m "MUL backend"
   git push
   ```
3. On Railway: New Project → Deploy from GitHub → select repo
4. Set Root Directory to: `backend`
5. Add environment variables:
   - MONGO_URL = (already in .env, Railway reads it automatically)
   - DB_NAME = salary_emergent
   - CORS_ORIGINS = *
6. Railway gives you a URL like: https://xxx.up.railway.app

## Step 2: Update Mobile App

Open `src/config/env.js` and update:
```js
BACKEND_URL: 'https://YOUR-RAILWAY-URL.up.railway.app',
API_BASE: 'https://YOUR-RAILWAY-URL.up.railway.app/api',
```

## Step 3: Test Backend

Open in browser: https://YOUR-RAILWAY-URL.up.railway.app/api/
You should see: {"message": "MUL Salary Tracker API"}

## Step 4: Build Mobile App

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

Wait ~10 min → download APK → install on phone.

## Railway Build Fix

If Railway fails with "mise python attestation" error:
- The `railway.toml` in the backend folder fixes this automatically
- It uses Nixpacks builder instead of Railpack
- If still failing: Railway Dashboard → Settings → Builder → set to Nixpacks

## MongoDB

Your MongoDB Atlas is already configured in .env:
- DB: salary_emergent
- Cluster: mul-mobile-backend.uacisjm.mongodb.net
