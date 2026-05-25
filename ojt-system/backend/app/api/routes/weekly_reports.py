from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from app.core.security import get_current_user, CoordOrAdmin
from app.db.database import get_supabase
from uuid import UUID
import uuid as uuid_lib
import mimetypes

router = APIRouter(prefix="/weekly-reports", tags=["Weekly Reports"])


# ── Schemas ───────────────────────────────────────────────
class ReportCreate(BaseModel):
    placement_id:    UUID
    week_number:     int
    week_start:      date
    week_end:        date
    accomplishments: str
    challenges:      Optional[str] = None
    learnings:       Optional[str] = None
    file_url:        Optional[str] = None
    file_name:       Optional[str] = None


class AcknowledgeBody(BaseModel):
    remarks:  Optional[str] = None
    status:   str = "acknowledged"   # acknowledged | returned


# ── Submit report (student) ───────────────────────────────
@router.post("", status_code=201)
@router.post("/", status_code=201, include_in_schema=False)
async def submit_report(
    data: ReportCreate,
    current_user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    # Verify placement belongs to this student
    placement = supabase.table("placements").select(
        "id, student_id, ojt_status, students(user_id)"
    ).eq("id", str(data.placement_id)).single().execute()

    if not placement.data:
        raise HTTPException(404, "Placement not found")

    p = placement.data

    if current_user["role"] == "student":
        if p["students"]["user_id"] != current_user["id"]:
            raise HTTPException(403, "Not your placement")

    if p["ojt_status"] != "active":
        raise HTTPException(400, f"Placement is not active (status: {p['ojt_status']})")

    if data.week_end < data.week_start:
        raise HTTPException(400, "Week end must be after week start")

    # Check duplicate week
    dup = supabase.table("weekly_reports").select("id") \
        .eq("placement_id", str(data.placement_id)) \
        .eq("week_number", data.week_number).execute()
    if dup.data:
        raise HTTPException(409, f"Report for week {data.week_number} already submitted")

    result = supabase.table("weekly_reports").insert({
        "placement_id":    str(data.placement_id),
        "student_id":      str(p["student_id"]),
        "week_number":     data.week_number,
        "week_start":      str(data.week_start),
        "week_end":        str(data.week_end),
        "accomplishments": data.accomplishments,
        "challenges":      data.challenges,
        "learnings":       data.learnings,
        "file_url":        data.file_url,
        "file_name":       data.file_name,
        "status":          "submitted",
    }).execute()

    if not result.data:
        raise HTTPException(500, "Failed to submit report")

    return result.data[0]


# ── Upload supporting document ────────────────────────────
BUCKET = "weekly-report-files"

@router.post("/upload-file")
async def upload_report_file(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    """Upload a supporting document to Supabase Storage.
    Returns { file_url, file_name } to be stored with the weekly report.
    """
    allowed_types = {
        "application/pdf",
        "image/jpeg", "image/png", "image/webp",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/zip",
    }

    content_type = file.content_type or mimetypes.guess_type(file.filename or "")[0] or "application/octet-stream"
    if content_type not in allowed_types:
        raise HTTPException(400, f"File type '{content_type}' is not allowed. Upload PDF, image, Word, or Excel files.")

    MAX_SIZE = 10 * 1024 * 1024  # 10 MB
    contents = await file.read()
    if len(contents) > MAX_SIZE:
        raise HTTPException(400, "File too large. Maximum size is 10 MB.")

    # Build a unique storage path: <user_id>/<uuid>_<filename>
    safe_name = (file.filename or "document").replace(" ", "_")
    storage_path = f"{current_user['id']}/{uuid_lib.uuid4()}_{safe_name}"

    try:
        supabase.storage.from_(BUCKET).upload(
            path=storage_path,
            file=contents,
            file_options={"content-type": content_type},
        )
    except Exception as e:
        raise HTTPException(500, f"File upload failed: {str(e)}")

    public_url = supabase.storage.from_(BUCKET).get_public_url(storage_path)

    return {
        "file_url":  public_url,
        "file_name": file.filename,
    }


# ── Get reports for a placement ───────────────────────────
@router.get("/{placement_id}")
async def get_reports(
    placement_id: UUID,
    current_user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    placement = supabase.table("placements").select(
        "student_id, students(user_id)"
    ).eq("id", str(placement_id)).single().execute()

    if not placement.data:
        raise HTTPException(404, "Placement not found")

    if current_user["role"] == "student":
        if placement.data["students"]["user_id"] != current_user["id"]:
            raise HTTPException(403, "Access denied")

    result = supabase.table("weekly_reports").select("*") \
        .eq("placement_id", str(placement_id)) \
        .order("week_number").execute()

    return result.data or []


# ── List all reports (coordinator view) ───────────────────
@router.get("")
@router.get("/", include_in_schema=False)
async def list_all_reports(
    status: Optional[str] = None,
    current_user=Depends(CoordOrAdmin),
    supabase=Depends(get_supabase),
):
    query = supabase.table("weekly_reports").select(
        "*, students(user_id, section, users!students_user_id_fkey(full_name))"
    )
    if status:
        query = query.eq("status", status)

    result = query.order("created_at", desc=True).execute()
    return result.data or []


# ── Acknowledge / Return report (coordinator) ─────────────
@router.put("/{report_id}/acknowledge")
async def acknowledge_report(
    report_id: UUID,
    body: AcknowledgeBody,
    current_user=Depends(CoordOrAdmin),
    supabase=Depends(get_supabase),
):
    if body.status not in ("acknowledged", "returned"):
        raise HTTPException(400, "Status must be 'acknowledged' or 'returned'")

    report = supabase.table("weekly_reports").select("id, status") \
        .eq("id", str(report_id)).single().execute()

    if not report.data:
        raise HTTPException(404, "Report not found")

    result = supabase.table("weekly_reports").update({
        "status":               body.status,
        "coordinator_remarks":  body.remarks,
        "acknowledged_by":      current_user["id"],
        "acknowledged_at":      datetime.utcnow().isoformat(),
        "updated_at":           datetime.utcnow().isoformat(),
    }).eq("id", str(report_id)).execute()

    if not result.data:
        raise HTTPException(500, "Failed to update report")

    return result.data[0]
