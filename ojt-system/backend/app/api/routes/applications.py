from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.core.security import get_current_user, CoordOrAdmin
from app.db.database import get_supabase

router = APIRouter(prefix="/applications", tags=["Applications"])


# ── Schemas ───────────────────────────────────────────────────────────────────
class ApplicationIn(BaseModel):
    company_id: Optional[str] = None
    semester: str
    academic_year: str
    consent_form_url: Optional[str] = None
    endorsement_letter_url: Optional[str] = None
    parent_consent_url: Optional[str] = None


class ReviewIn(BaseModel):
    status: str               # approved | rejected | under_review
    rejection_reason: Optional[str] = None


# ── Submit (student) ──────────────────────────────────────────────────────────
@router.post("", status_code=201)
async def submit_application(
    data: ApplicationIn,
    current_user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    if current_user["role"] != "student":
        raise HTTPException(403, "Students only")

    # Get student record
    s = supabase.table("students").select("*").eq("user_id", current_user["id"]).single().execute()
    if not s.data:
        raise HTTPException(404, "Student profile not found")

    student = s.data

    # Must be portal verified
    if not student.get("portal_verified"):
        raise HTTPException(400, "You must verify your PSU portal before applying")

    # Must be eligible
    if student.get("has_disqualifying_grade"):
        raise HTTPException(400, "You are not eligible for OJT — you have failed or incomplete subjects")

    if student.get("enrollment_status") != "enrolled":
        raise HTTPException(400, "You must be enrolled to apply for OJT")

    # No existing active application
    existing = supabase.table("ojt_applications").select("id, status").eq(
        "student_id", student["id"]
    ).in_("status", ["pending", "under_review", "approved"]).execute()

    if existing.data:
        raise HTTPException(400, f"You already have an active application (status: {existing.data[0]['status']})")

    # Create application
    result = supabase.table("ojt_applications").insert({
        "student_id":              student["id"],
        "company_id":              data.company_id,
        "semester":                data.semester,
        "academic_year":           data.academic_year,
        "status":                  "pending",
        "consent_form_url":        data.consent_form_url,
        "endorsement_letter_url":  data.endorsement_letter_url,
        "parent_consent_url":      data.parent_consent_url,
    }).execute()

    if not result.data:
        raise HTTPException(500, "Failed to submit application")

    return result.data[0]


# ── List ──────────────────────────────────────────────────────────────────────
@router.get("")
async def list_applications(
    status: Optional[str] = None,
    current_user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    if current_user["role"] == "student":
        # Students see only their own
        student = supabase.table("students").select("id").eq("user_id", current_user["id"]).single().execute()
        if not student.data:
            return []
        query = supabase.table("ojt_applications").select(
            "*, companies(name, address)"
        ).eq("student_id", student.data["id"])
    else:
        # Coordinator/admin see all with student info
        query = supabase.table("ojt_applications").select(
            "*, companies(name), students(student_number, section, program, users!students_user_id_fkey(full_name))"
        )

    if status:
        query = query.eq("status", status)

    result = query.order("created_at", desc=True).execute()
    return result.data or []


# ── Get one ───────────────────────────────────────────────────────────────────
@router.get("/{app_id}")
async def get_application(
    app_id: str,
    current_user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    result = supabase.table("ojt_applications").select(
        "*, companies(name, address), students(student_number, program, users!students_user_id_fkey(full_name))"
    ).eq("id", app_id).single().execute()

    if not result.data:
        raise HTTPException(404, "Application not found")

    app = result.data

    # Students can only see their own
    if current_user["role"] == "student":
        student = supabase.table("students").select("id").eq("user_id", current_user["id"]).single().execute()
        if not student.data or app["student_id"] != student.data["id"]:
            raise HTTPException(403, "Access denied")

    return app


# ── Review (coordinator) ──────────────────────────────────────────────────────
@router.put("/{app_id}/review")
async def review_application(
    app_id: str,
    data: ReviewIn,
    current_user=Depends(CoordOrAdmin),
    supabase=Depends(get_supabase),
):
    valid = {"approved", "rejected", "under_review"}
    if data.status not in valid:
        raise HTTPException(400, f"Status must be one of {valid}")

    if data.status == "rejected" and not data.rejection_reason:
        raise HTTPException(400, "Rejection reason is required")

    # Get app
    app = supabase.table("ojt_applications").select("*").eq("id", app_id).single().execute()
    if not app.data:
        raise HTTPException(404, "Application not found")

    if app.data["status"] in ("approved", "withdrawn"):
        raise HTTPException(400, f"Cannot review — application is already {app.data['status']}")

    result = supabase.table("ojt_applications").update({
        "status":           data.status,
        "rejection_reason": data.rejection_reason,
        "reviewed_by":      current_user["id"],
        "reviewed_at":      datetime.utcnow().isoformat(),
        "updated_at":       datetime.utcnow().isoformat(),
    }).eq("id", app_id).execute()

    return result.data[0]


# ── Withdraw (student) ────────────────────────────────────────────────────────
@router.put("/{app_id}/withdraw")
async def withdraw_application(
    app_id: str,
    current_user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    if current_user["role"] != "student":
        raise HTTPException(403, "Students only")

    student = supabase.table("students").select("id").eq("user_id", current_user["id"]).single().execute()
    if not student.data:
        raise HTTPException(404, "Student not found")

    app = supabase.table("ojt_applications").select("*").eq("id", app_id).single().execute()
    if not app.data:
        raise HTTPException(404, "Application not found")

    if app.data["student_id"] != student.data["id"]:
        raise HTTPException(403, "Not your application")

    if app.data["status"] not in ("pending", "under_review"):
        raise HTTPException(400, f"Cannot withdraw — status is {app.data['status']}")

    result = supabase.table("ojt_applications").update({
        "status":     "withdrawn",
        "updated_at": datetime.utcnow().isoformat(),
    }).eq("id", app_id).execute()

    return result.data[0]
