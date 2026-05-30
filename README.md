# MUL Salary Mobile App

React Native (Expo) mobile app — converted from the MUL Salary Management web project.

---

## Project structure

```
MUL-Mobile/
├── App.js                          # Root entry point
├── app.json                        # Expo config
├── eas.json                        # Build & deploy config
├── package.json
├── babel.config.js
└── src/
    ├── api/
    │   └── client.js               # All API calls (ported from web api.js)
    ├── config/
    │   └── env.js                  # Backend URL config ← EDIT THIS FIRST
    ├── context/
    │   ├── AuthContext.js          # Auth (SecureStore instead of localStorage)
    │   └── ThemeContext.js         # Dark/light mode
    ├── navigation/
    │   └── AppNavigator.js         # Bottom tab navigator
    ├── screens/
    │   ├── LoginScreen.js          # Login page
    │   ├── DashboardScreen.js      # Monthly summary + charts
    │   ├── DailyEntryScreen.js     # Add/edit work entries
    │   ├── PayslipScreen.js        # PDF download + email
    │   └── SettingsScreen.js       # Salary params + SMTP
    ├── components/
    │   └── UI.js                   # Reusable components (Button, Card, Input...)
    └── theme/
        └── colors.js               # Color palette + spacing constants
```

---

## Step 1 — Prerequisites

Install these on your computer:

```bash
# Node.js 18+ (https://nodejs.org)
node --version   # should be v18+

# Install Expo CLI globally
npm install -g expo-cli eas-cli

# On your phone: install "Expo Go" from Play Store or App Store
```

---

## Step 2 — Install dependencies

```bash
cd MUL-Mobile
npm install
```

---

## Step 3 — Configure your backend URL

Edit `src/config/env.js`:

```js
// Find your computer's local IP:
//   Windows: ipconfig → "IPv4 Address"
//   Mac/Linux: ifconfig | grep "inet "

export const ENV = {
  BACKEND_URL: 'http://192.168.178.27:8000',
  API_BASE: 'http://192.168.178.27:8000/api',
  APP_NAME: 'MUL Salary',
  VERSION: '1.0.0',
};
```


> Your phone and computer must be on the same Wi-Fi network.

---

## Step 4 — Start your FastAPI backend

```bash
# In your original MUL-Salary-Management-Emergent folder:
cd backend
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8000 --reload
```

The `--host 0.0.0.0` makes it accessible from your phone.

---

## Step 5 — Run the app

```bash
# Start Expo development server
npx expo start

# Options:
# Press 'a' → open Android emulator
# Press 'i' → open iOS simulator (Mac only)
# Scan QR code with Expo Go app on your phone (easiest!)
```

---

## Step 6 — Test on your device

1. Open **Expo Go** on your phone
2. Tap **"Scan QR code"**
3. Scan the QR from your terminal
4. App loads on your phone instantly!
5. Login with any email + password (4+ chars)

---

## Step 7 — Share with testers (no store needed)

```bash
# Login to Expo account (free)
eas login

# Push an update testers can open in Expo Go
eas update --branch preview --message "First preview"
```

Share the link — testers open it in Expo Go.

---

## Step 8 — Build for production

```bash
# Build Android APK (internal testing)
eas build --platform android --profile preview

# Build for Google Play Store
eas build --platform android --profile production

# Build for iOS
eas build --platform ios --profile production
```

---

## Step 9 — Deploy backend to the internet

For a production app, deploy FastAPI to the cloud:

### Option A: Railway (easiest)
1. Go to railway.app → New Project → Deploy from GitHub
2. Select your backend folder
3. Add env vars: `MONGO_URL`, `DB_NAME`
4. Railway gives you a public URL → update `env.js`

### Option B: Render
1. Go to render.com → New Web Service
2. Connect your repo, set build command: `pip install -r requirements.txt`
3. Start command: `uvicorn server:app --host 0.0.0.0 --port $PORT`
4. Add MongoDB Atlas URL as env var

---

## Step 10 — Submit to stores

```bash
# Android (Google Play) — needs $25 developer account
eas submit --platform android

# iOS (App Store) — needs $99/year Apple Developer account
eas submit --platform ios
```

---

## What's reused from the web app

| Web file | Mobile equivalent |
|---|---|
| `frontend/src/lib/api.js` | `src/api/client.js` (100% same logic) |
| `frontend/src/context/AuthContext.js` | `src/context/AuthContext.js` (SecureStore) |
| `frontend/src/context/ThemeContext.js` | `src/context/ThemeContext.js` |
| `frontend/src/pages/Login.jsx` | `src/screens/LoginScreen.js` |
| `frontend/src/pages/Dashboard.jsx` | `src/screens/DashboardScreen.js` |
| `frontend/src/pages/DailyEntry.jsx` | `src/screens/DailyEntryScreen.js` |
| `frontend/src/pages/Payslip.jsx` | `src/screens/PayslipScreen.js` |
| `frontend/src/pages/Settings.jsx` | `src/screens/SettingsScreen.js` |
| `backend/server.py` | **Unchanged** — same FastAPI backend |

---

## Screens included

- Login (with dark mode toggle)
- Dashboard (KPI cards, charts, recent entries)
- Daily Entry (live pay calculation, date/time picker)
- Payslip (PDF download, Excel export, email)
- Settings (salary params, SMTP, dark mode, logout)

---

## Login credentials

Demo mode (same as web app):
- Email: any email address
- Password: any 4+ character password
