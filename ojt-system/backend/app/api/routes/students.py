from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.core.security import get_current_user, CoordOrAdmin
from app.db.database import get_supabase

router = APIRouter(prefix="/students", tags=["Students"])


class StudentUpdate(BaseModel):
    student_number: Optional[str] = None
    program: Optional[str] = None
    section: Optional[str] = None
    year_level: Optional[int] = None
    required_hours: Optional[int] = None
    enrollment_status: Optional[str] = None
    has_disqualifying_grade: Optional[bool] = None
    gpa: Optional[float] = None


@router.get("")
async def list_students(
    section: Optional[str] = None,
    program: Optional[str] = None,
    enrollment_status: Optional[str] = None,
    current_user=Depends(CoordOrAdmin),
    supabase=Depends(get_supabase),
):
    query = supabase.table("students").select(
        "*, users!students_user_id_fkey(full_name, email)"
    )
    if section:
        query = query.eq("section", section)
    if program:
        query = query.eq("program", program)
    if enrollment_status:
        query = query.eq("enrollment_status", enrollment_status)

    result = query.order("created_at", desc=True).execute()
    return result.data or []


@router.get("/me")
async def get_my_profile(
    current_user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    if current_user["role"] != "student":
        raise HTTPException(403, "Students only")
    result = supabase.table("students").select("*") \
        .eq("user_id", current_user["id"]).single().execute()
    if not result.data:
        raise HTTPException(404, "Student profile not found")
    return result.data


@router.get("/{student_id}/eligibility")
async def check_eligibility(
    student_id: str,
    current_user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    result = supabase.table("students").select("*") \
        .eq("id", student_id).single().execute()
    if not result.data:
        raise HTTPException(404, "Student not found")

    if current_user["role"] == "student" and result.data["user_id"] != current_user["id"]:
        raise HTTPException(403, "Access denied")

    student = result.data
    issues = []
    if student["enrollment_status"] != "enrolled":
        issues.append(f"Not enrolled (status: {student['enrollment_status']})")
    if student.get("has_disqualifying_grade"):
        issues.append("Has a disqualifying grade")

    placed = supabase.table("placements").select("id") \
        .eq("student_id", student_id).eq("ojt_status", "active").execute()
    if placed.data:
        issues.append("Already has an active OJT placement")

    return {
        "student_id": student_id,
        "is_eligible": len(issues) == 0,
        "issues": issues,
        "message": "Eligible for OJT" if len(issues) == 0 else "Not eligible",
    }


@router.get("/{student_id}/hours-summary")
async def hours_summary(
    student_id: str,
    current_user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    student = supabase.table("students").select("required_hours, user_id") \
        .eq("id", student_id).single().execute()
    if not student.data:
        raise HTTPException(404, "Student not found")

    if current_user["role"] == "student" and student.data["user_id"] != current_user["id"]:
        raise HTTPException(403, "Access denied")

    placement = supabase.table("placements").select("id") \
        .eq("student_id", student_id).eq("ojt_status", "active").execute()
    rendered = 0.0
    if placement.data:
        dtr = supabase.table("dtr_logs").select("hours_rendered") \
            .eq("placement_id", placement.data[0]["id"]).execute()
        rendered = round(sum(r["hours_rendered"] for r in (dtr.data or [])), 2)

    required = student.data["required_hours"] or 480
    return {
        "student_id": student_id,
        "required_hours": required,
        "rendered_hours": rendered,
        "remaining_hours": max(0, required - rendered),
        "percentage": round(min(100, (rendered / required) * 100), 1) if required > 0 else 0,
    }


@router.get("/{student_id}")
async def get_student(
    student_id: str,
    current_user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    result = supabase.table("students").select(
        "*, users!students_user_id_fkey(full_name, email)"
    ).eq("id", student_id).single().execute()
    if not result.data:
        raise HTTPException(404, "Student not found")

    if current_user["role"] == "student" and result.data["user_id"] != current_user["id"]:
        raise HTTPException(403, "Access denied")

    return result.data


@router.put("/{student_id}")
async def update_student(
    student_id: str,
    data: StudentUpdate,
    current_user=Depends(CoordOrAdmin),
    supabase=Depends(get_supabase),
):
    payload = data.model_dump(exclude_none=True)
    if not payload:
        raise HTTPException(400, "Nothing to update")

    if "program" in payload:
        hours_map = {"IT": 480, "ABEL": 400, "Engineering": 240}
        payload["required_hours"] = hours_map.get(payload["program"], 480)

    result = supabase.table("students").update(payload).eq("id", student_id).execute()
    if not result.data:
        raise HTTPException(404, "Student not found")
    return result.data[0]
