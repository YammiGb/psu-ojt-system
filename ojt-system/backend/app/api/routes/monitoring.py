from fastapi import APIRouter, Depends
from app.core.security import get_current_user, CoordOrAdmin
from app.db.database import get_supabase

router = APIRouter(prefix="/monitoring", tags=["Monitoring"])


@router.get("/dashboard-stats")
async def dashboard_stats(
    current_user=Depends(CoordOrAdmin),
    supabase=Depends(get_supabase),
):
    # Total students
    students = supabase.table("students").select("id", count="exact").execute()
    total_students = students.count or 0

    # Active placements
    active = supabase.table("placements").select("id", count="exact") \
        .eq("ojt_status", "active").execute()
    active_placements = active.count or 0

    # Pending applications
    pending_apps = supabase.table("ojt_applications").select("id", count="exact") \
        .eq("status", "pending").execute()
    pending_applications = pending_apps.count or 0

    # Pending weekly reports (submitted but not yet acknowledged)
    pending_reports = supabase.table("weekly_reports").select("id", count="exact") \
        .eq("status", "submitted").execute()
    pending_weekly_reports = pending_reports.count or 0

    # MOAs in review (not yet signed/rejected)
    pending_moas = supabase.table("moa_requests").select("id", count="exact") \
        .not_.in_("status", ["signed", "rejected"]).execute()
    pending_moa_approvals = pending_moas.count or 0

    # Completed OJT
    completed = supabase.table("placements").select("id", count="exact") \
        .eq("ojt_status", "completed").execute()
    completed_ojt = completed.count or 0

    # Low progress: active students < 50% of required hours
    active_placements_data = supabase.table("placements").select(
        "id, students(required_hours)"
    ).eq("ojt_status", "active").execute().data or []

    low_progress = 0
    for p in active_placements_data:
        required = (p.get("students") or {}).get("required_hours", 480)
        dtr = supabase.table("dtr_logs").select("hours_rendered") \
            .eq("placement_id", p["id"]).execute()
        rendered = sum(r["hours_rendered"] for r in (dtr.data or []))
        if required > 0 and (rendered / required) < 0.5:
            low_progress += 1

    # Recent applications (last 5)
    recent_apps = supabase.table("ojt_applications").select(
        "id, status, created_at, students(users!students_user_id_fkey(full_name)), companies(name)"
    ).order("created_at", desc=True).limit(5).execute().data or []

    # Recent weekly reports (last 5 submitted)
    recent_reports = supabase.table("weekly_reports").select(
        "id, week_number, status, created_at, "
        "students(users!students_user_id_fkey(full_name))"
    ).eq("status", "submitted").order("created_at", desc=True).limit(5).execute().data or []

    return {
        "total_students":        total_students,
        "active_placements":     active_placements,
        "pending_applications":  pending_applications,
        "pending_weekly_reports": pending_weekly_reports,
        "pending_moa_approvals": pending_moa_approvals,
        "completed_ojt":         completed_ojt,
        "low_progress_students": low_progress,
        "upcoming_site_visits":  0,  # placeholder until site visits module is built
        "recent_applications":   recent_apps,
        "recent_weekly_reports": recent_reports,
    }
