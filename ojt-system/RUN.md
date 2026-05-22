# Running the OJT System (Frontend + Backend)

This guide explains how to run the project locally (Windows). It assumes the repo root is `ojt-system/`.

## Prerequisites
- Node.js (v16+)
- npm (bundled with Node) or yarn
- Python 3.10+ and pip
- Git (optional)

## Backend (FastAPI)

1. Open a terminal and go to the backend folder:

```powershell
cd ojt-system\backend
```

2. Create and activate a virtual environment (PowerShell):

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

3. Install Python dependencies:

```powershell
pip install -r requirements.txt
```

4. Create a `.env` file in `ojt-system/backend/` with the required environment variables. Example content:

```
SUPABASE_URL=https://your-supabase-url
SUPABASE_KEY=your-supabase-key
DATABASE_URL=postgresql://user:pass@host:port/dbname
SECRET_KEY=replace-with-a-long-random-string
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7
```

Do NOT commit real secrets to source control.

5. Start the backend (development):

```powershell
# from repo root
cd ojt-system\backend
# either use the provided helper
..\start-backend.bat
# or run uvicorn directly
venv\Scripts\python -m uvicorn main:app --reload --port 8000
```

The API base URL used by the frontend is `http://localhost:8000/api/v1` by default (see `frontend/src/services/api.js`).

## Frontend (Vite + React)

1. Open a new terminal and go to the frontend folder:

```powershell
cd ojt-system\frontend
```

2. Install dependencies:

```powershell
npm install
# or
# yarn
```

3. Start the dev server:

```powershell
# from frontend folder
npm run dev
# or use helper from repo root
# ..\start-frontend.bat
```

4. Open `http://localhost:5173` (or the URL printed by Vite) in your browser.

If your backend is hosted on a different URL, update `frontend/src/services/api.js` `baseURL` accordingly.

## Notes & Troubleshooting
- If you get CORS or network errors, ensure backend is running and the baseURL matches.
- When changing environment variables, restart the backend.
- If you need a database, ensure `DATABASE_URL` points to a running Postgres instance and the DB schema is prepared (use the SQL files in `backend/` if you need to seed or create tables).
- For Windows PowerShell, you may need to set the execution policy to allow script activation:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
.\venv\Scripts\Activate.ps1
```

## Quick start (fast)

```powershell
# Backend
cd ojt-system\backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
venv\Scripts\python -m uvicorn main:app --reload --port 8000

# Frontend (new terminal)
cd ojt-system\frontend
npm install
npm run dev
```

---

If you want, I can also:
- Add example `.env.example` with placeholder variables
- Add a single `docker-compose.yml` to run Postgres + backend + frontend locally

Happy to add those next.