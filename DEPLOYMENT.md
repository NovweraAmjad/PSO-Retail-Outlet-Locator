# PSO Retail Outlet Locator Deployment Guide (Beginner Friendly)

This project is ready to deploy as:
- Frontend: React + Vite static site
- Backend: FastAPI web service
- Database: SQLite file included in repository at backend/data/pso_outlets.db

## Recommended Easiest Platform

Use **Render** with:
1. One Python Web Service for FastAPI
2. One Static Site for React/Vite

Why Render for this project:
- Simple UI for beginners
- Works well with FastAPI + Vite
- Can serve SQLite from repository immediately
- Supports optional persistent disks for SQLite write persistence

## Pre-Deployment Checklist

Run these from project root:

```powershell
cd "c:\Users\lenovo\Desktop\PSO proj"

# 1) Verify frontend build
cd frontend
npm ci
npm run build
cd ..

# 2) Verify backend dependencies
cd backend
pip install -r requirements.txt
cd ..

# 3) Ensure DB file exists
# required file: backend/data/pso_outlets.db
```

## Important Environment Variables

### Backend
- `ALLOWED_ORIGINS`:
  - Comma-separated frontend origins.
  - Example: `https://pso-locator-frontend.onrender.com`
- `CORS_ALLOW_CREDENTIALS`:
  - `false` for this app (recommended).
- `PSO_DB_FILE` (optional):
  - Use only if you mount a disk and want DB outside repo path.

### Frontend
- `VITE_API_URL`:
  - Your deployed backend base URL.
  - Example: `https://pso-locator-api.onrender.com`

## Option A: Deploy with render.yaml (Fastest)

A ready blueprint file exists at [render.yaml](render.yaml).

### Steps
1. Push this project to GitHub.
2. In Render dashboard:
   - New + -> Blueprint
   - Connect repo
   - Select branch
   - Deploy
3. After first deploy, update these values if service names differ:
   - Backend `ALLOWED_ORIGINS`
   - Frontend `VITE_API_URL`
4. Redeploy both services.

## Option B: Manual Render Setup (No Blueprint)

### 1) Create Backend Service
- Render -> New -> Web Service
- Connect repository
- Settings:
  - Root Directory: `backend`
  - Runtime: `Python`
  - Build Command: `pip install -r requirements.txt`
  - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

Set environment variables:
- `ALLOWED_ORIGINS=https://<your-frontend-domain>`
- `CORS_ALLOW_CREDENTIALS=false`

Deploy and copy backend URL, for example:
- `https://pso-locator-api.onrender.com`

### 2) Create Frontend Static Site
- Render -> New -> Static Site
- Connect same repository
- Settings:
  - Root Directory: `frontend`
  - Build Command: `npm ci && npm run build`
  - Publish Directory: `dist`

Set environment variables:
- `VITE_API_URL=https://<your-backend-domain>`

Set redirect/rewrite for SPA:
- Source: `/*`
- Destination: `/index.html`
- Action: Rewrite

Deploy frontend.

### 3) Update Backend CORS Origin
Set backend env var:
- `ALLOWED_ORIGINS=https://<actual-frontend-domain>`

Redeploy backend.

## SQLite Data Notes

- The outlet data file is included at:
  - [backend/data/pso_outlets.db](backend/data/pso_outlets.db)
- FastAPI reads this file directly.
- Search, filters, map data, facilities, and print all use this data path.

### Optional Persistent Disk (for feedback/history durability)

If you want SQLite writes to survive redeploy/restarts:
1. Add a Render persistent disk to backend service.
2. Copy DB file once to mounted disk path.
3. Set `PSO_DB_FILE` to mounted path (example `/var/data/pso_outlets.db`).

Without persistent disk:
- Reads work fine from repo file.
- Runtime writes may not persist forever on free/ephemeral environments.

## Post-Deploy Validation

Check these URLs:

1. Backend health:
- `https://<backend-domain>/health`

2. Backend station API:
- `https://<backend-domain>/api/stations?limit=5`

3. Frontend loads and calls backend:
- Open frontend URL
- Verify map pins, search, and filters return data

Functional checks:
1. Search stations by city/outlet
2. Filter by card status and outlet type
3. Open map and marker popups
4. Toggle My Location (works under HTTPS)
5. View facilities panel
6. Print report
7. Toggle light/dark mode

## Local Production-Like Build Commands

```powershell
# Frontend
cd "c:\Users\lenovo\Desktop\PSO proj\frontend"
$env:VITE_API_URL="https://your-backend-domain.onrender.com"
npm run build

# Backend (local run)
cd "c:\Users\lenovo\Desktop\PSO proj\backend"
$env:ALLOWED_ORIGINS="https://your-frontend-domain.onrender.com"
$env:CORS_ALLOW_CREDENTIALS="false"
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## Files Added/Updated for Deployment

- Updated: [backend/app/main.py](backend/app/main.py)
- Updated: [backend/app/db.py](backend/app/db.py)
- Added: [backend/.env.example](backend/.env.example)
- Added: [frontend/.env.example](frontend/.env.example)
- Added: [frontend/.env.production.example](frontend/.env.production.example)
- Added: [render.yaml](render.yaml)
