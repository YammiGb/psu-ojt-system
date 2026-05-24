from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import (
    auth, companies, students, applications, placements,
    moa, dtr, weekly_reports, evaluations, reports, monitoring
)

app = FastAPI(title="OJT System", version="1.0.0", redirect_slashes=False)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,           prefix="/api/v1")
app.include_router(companies.router,      prefix="/api/v1")
app.include_router(students.router,       prefix="/api/v1")
app.include_router(applications.router,   prefix="/api/v1")
app.include_router(placements.router,     prefix="/api/v1")
app.include_router(moa.router,            prefix="/api/v1")
app.include_router(dtr.router,            prefix="/api/v1")
app.include_router(weekly_reports.router, prefix="/api/v1")
app.include_router(evaluations.router,    prefix="/api/v1")
app.include_router(reports.router,        prefix="/api/v1")
app.include_router(monitoring.router,     prefix="/api/v1")

@app.get("/health")
async def health():
    return {"status": "ok"}
