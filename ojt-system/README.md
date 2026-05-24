# 🎓 OJT Monitoring System

A full-stack University OJT (On-the-Job Training) Monitoring & Evaluation System.

**Stack:** FastAPI · React (Vite) · Supabase (PostgreSQL) · Tailwind CSS · JWT Auth

---

## 📁 Project Structure

```
ojt-system/
├── backend/
│   ├── app/
│   │   ├── api/routes/      # All API route handlers
│   │   ├── core/            # Config, security, JWT
│   │   ├── db/              # Supabase client
│   │   └── schemas/         # Pydantic request/response models
│   ├── main.py              # FastAPI app entry point
│   ├── schema.sql           # Full Supabase DB schema
│   ├── requirements.txt
│   └── .env                 # ← Fill this in
├── frontend/
│   ├── src/
│   │   ├── pages/           # student/ coordinator/ supervisor/ admin/
│   │   ├── components/      # Shared UI components
│   │   ├── services/        # All API calls
│   │   ├── context/         # Auth context
│   │   └── layouts/         # AppLayout with sidebar
│   └── package.json
├── start-backend.bat
├── start-frontend.bat
└── README.md
```

---

## ⚙️ Setup Instructions

### 1. Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the full contents of `backend/schema.sql`
3. Copy your project credentials:
   - Project URL
   - Service Role Key (Settings → API)
   - Database connection string (Settings → Database)

### 2. Backend Setup

Edit `backend/.env`:

```env
SECRET_KEY=your-super-secret-key-min-32-characters
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key
SUPABASE_DB_URL=postgresql://postgres:your-password@db.your-project.supabase.co:5432/postgres

FRONTEND_URL=http://localhost:5173
```

Then run:

```bash
# Windows
double-click start-backend.bat

# Or manually:
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 3. Frontend Setup

```bash
# Windows
double-click start-frontend.bat

# Or manually:
cd frontend
npm install
npm run dev
```

---

## 🌐 URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |
| API Docs (Redoc) | http://localhost:8000/redoc |

---

## 👥 User Roles

| Role | Access |
|------|--------|
| `student` | Application, DTR, weekly reports, grades, portfolio |
| `coordinator` | Full monitoring, evaluations, MOA, reports |
| `supervisor` | Intern list, submit evaluations |
| `admin` | Analytics, archives, system-wide access |

**Register at:** http://localhost:5173/register

---

## 📦 Key Modules

| Module | Features |
|--------|----------|
| **Pre-OJT** | Eligibility check, digital application, document tracking |
| **MOA Workflow** | 8-step signing chain (Coordinator → President) |
| **Placement** | Company assignment, slot capacity, transfers |
| **Monitoring** | DTR logging, weekly journals, site visits, section view |
| **Evaluation** | 50/50 grade formula (supervisor + coordinator) |
| **End-OJT** | Excel export, PDF certificates, semester archiving |
| **Notifications** | Real-time alerts for pending reports, low hours |

---

## 🔐 Security

- JWT access + refresh tokens (backend-only)
- bcrypt password hashing
- Role-based access control on every API route
- No direct frontend database access
- Pydantic validation on all inputs

---

## 📊 Grading Formula

```
Final Grade = (Supervisor Average × 0.5) + (Coordinator Average × 0.5)

Where:
  Supervisor Average  = (Midterm Score + Final Score) / 2
  Coordinator Average = (Midterm Score + Final Score) / 2
```

---

## 🛠️ API Endpoints

| Group | Base Path |
|-------|-----------|
| Auth | `/api/v1/auth` |
| Students | `/api/v1/students` |
| Companies | `/api/v1/companies` |
| Placements | `/api/v1/placements` |
| Monitoring | `/api/v1/monitoring` |
| Evaluations | `/api/v1/evaluations` |
| MOA | `/api/v1/moa` |
| Reports | `/api/v1/reports` |
| Notifications | `/api/v1/notifications` |

Full interactive docs available at `/docs` when backend is running.

---

## 🚀 Production Notes

- Set a strong `SECRET_KEY` (32+ chars)
- Use Supabase Row Level Security (RLS) for extra DB-level protection
- Deploy backend to Railway / Render / EC2
- Deploy frontend to Vercel / Netlify
- Set `FRONTEND_URL` in `.env` to your deployed frontend URL
