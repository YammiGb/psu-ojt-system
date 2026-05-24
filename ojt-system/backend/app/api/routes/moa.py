from fastapi import APIRouter, Depends, HTTPException, Body, UploadFile, File
from pydantic import BaseModel
from app.core.security import get_current_user, require_roles
from app.db.supabase import get_supabase
from uuid import UUID
from datetime import datetime
from typing import Optional
import mimetypes
import uuid as uuid_lib

router = APIRouter(prefix="/moa", tags=["MOA Workflow"])

CoordinatorOrAdmin = require_roles("coordinator", "admin")

MOA_STEPS = [
    {"key": "campus_coordinator", "label": "Campus Coordinator"},
    {"key": "ced",                "label": "CED"},
    {"key": "lingayen",           "label": "Lingayen Campus"},
    {"key": "legal",              "label": "Legal Office"},
    {"key": "ojt_director",       "label": "OJT Director"},
    {"key": "vp",                 "label": "VP"},
    {"key": "bordsec",            "label": "BORDSEC"},
    {"key": "president",          "label": "President"},
]

STEP_KEYS = [s["key"] for s in MOA_STEPS]


class MOAInitiate(BaseModel):
    company_id: UUID
    document_url: Optional[str] = None
    document_name: Optional[str] = None
    semester: Optional[str] = None
    academic_year: Optional[str] = None


class RejectBody(BaseModel):
    reason: str


class AdvanceBody(BaseModel):
    remarks: Optional[str] = None


@router.post("/", status_code=201)
async def initiate_moa(
    data: MOAInitiate,
    current_user=Depends(CoordinatorOrAdmin),
    supabase=Depends(get_supabase)
):
    company = supabase.table("companies").select("id, name").eq("id", str(data.company_id)).execute()
    if not company.data:
        raise HTTPException(404, "Company not found")

    result = supabase.table("moa_requests").insert({
        "company_id": str(data.company_id),
        "initiated_by": current_user["id"],
        "status": "campus_coordinator",
        "current_step": 0,
        "document_url": data.document_url,
        "document_name": data.document_name,
        "semester": data.semester,
        "academic_year": data.academic_year,
    }).execute()

    if not result.data:
        raise HTTPException(500, "Failed to create MOA request")

    return result.data[0]


# ── Upload MOA document ───────────────────────────────────
MOA_BUCKET = "moa-documents"

@router.post("/upload-file")
async def upload_moa_file(
    file: UploadFile = File(...),
    current_user=Depends(CoordinatorOrAdmin),
    supabase=Depends(get_supabase),
):
    """Upload a MOA document to Supabase Storage.
    Returns { file_url, file_name } to be stored with the MOA request.
    """
    allowed_types = {
        "application/pdf",
        "image/jpeg", "image/png", "image/webp",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/zip",
        "application/x-zip-compressed",
    }

    content_type = file.content_type or mimetypes.guess_type(file.filename or "")[0] or "application/octet-stream"
    if content_type not in allowed_types:
        raise HTTPException(400, f"File type '{content_type}' is not allowed. Upload PDF, image, Word, Excel, or ZIP files.")

    MAX_SIZE = 15 * 1024 * 1024  # 15 MB
    contents = await file.read()
    if len(contents) > MAX_SIZE:
        raise HTTPException(400, "File too large. Maximum size is 15 MB.")

    # Build a unique storage path: moa/<uuid>_<filename>
    safe_name = (file.filename or "moa_document").replace(" ", "_")
    storage_path = f"moa/{uuid_lib.uuid4()}_{safe_name}"

    try:
        supabase.storage.from_(MOA_BUCKET).upload(
            path=storage_path,
            file=contents,
            file_options={"content-type": content_type},
        )
    except Exception as e:
        raise HTTPException(500, f"File upload failed: {str(e)}")

    public_url = supabase.storage.from_(MOA_BUCKET).get_public_url(storage_path)

    return {
        "file_url":  public_url,
        "file_name": file.filename,
    }


@router.get("/report/summary")
async def moa_summary_report(
    current_user=Depends(CoordinatorOrAdmin),
    supabase=Depends(get_supabase)
):
    result = supabase.table("moa_requests").select("status, companies(name)").execute()
    data = result.data or []

    summary = {}
    for item in data:
        s = item["status"]
        summary[s] = summary.get(s, 0) + 1

    return {"total": len(data), "by_status": summary, "items": data}


@router.get("/")
async def list_moas(
    status: str = None,
    current_user=Depends(get_current_user),
    supabase=Depends(get_supabase)
):
    query = supabase.table("moa_requests").select("*, companies(name, industry)")
    if status:
        query = query.eq("status", status)
    result = query.order("created_at", desc=True).execute()
    return result.data or []


@router.get("/{moa_id}")
async def get_moa(
    moa_id: UUID,
    current_user=Depends(get_current_user),
    supabase=Depends(get_supabase)
):
    result = supabase.table("moa_requests").select("*, companies(name, industry)").eq("id", str(moa_id)).single().execute()
    if not result.data:
        raise HTTPException(404, "MOA not found")
    return result.data


@router.post("/{moa_id}/advance")
async def advance_moa(
    moa_id: UUID,
    body: AdvanceBody = Body(default=AdvanceBody()),
    current_user=Depends(get_current_user),
    supabase=Depends(get_supabase)
):
    """Advance MOA to the next approval step"""
    moa = supabase.table("moa_requests").select("*").eq("id", str(moa_id)).single().execute()
    if not moa.data:
        raise HTTPException(404, "MOA not found")

    m = moa.data
    if m["status"] in ("signed", "rejected"):
        raise HTTPException(400, f"MOA is already {m['status']}")

    current_step = m["current_step"]
    if current_step >= len(STEP_KEYS):
        raise HTTPException(400, "MOA has already completed all steps")

    step_key = STEP_KEYS[current_step]
    next_step = current_step + 1
    next_status = STEP_KEYS[next_step] if next_step < len(STEP_KEYS) else "signed"

    update = {
        f"{step_key}_signed_at": datetime.utcnow().isoformat(),
        f"{step_key}_by": current_user["id"],
        f"{step_key}_name": current_user.get("full_name", current_user.get("email", "")),
        "current_step": next_step,
        "status": next_status,
        "updated_at": datetime.utcnow().isoformat(),
    }
    if body.remarks:
        update[f"{step_key}_remarks"] = body.remarks

    result = supabase.table("moa_requests").update(update).eq("id", str(moa_id)).execute()
    if not result.data:
        raise HTTPException(500, "Failed to advance MOA")

    step_label = MOA_STEPS[current_step]["label"]
    next_label = MOA_STEPS[next_step]["label"] if next_step < len(MOA_STEPS) else "Fully Signed"
    return {
        "message": f"Signed by {step_label}. Now pending: {next_label}",
        "moa": result.data[0]
    }


@router.post("/{moa_id}/reject")
async def reject_moa(
    moa_id: UUID,
    body: RejectBody,
    current_user=Depends(get_current_user),
    supabase=Depends(get_supabase)
):
    moa = supabase.table("moa_requests").select("status, current_step").eq("id", str(moa_id)).single().execute()
    if not moa.data:
        raise HTTPException(404, "MOA not found")
    if moa.data["status"] in ("signed", "rejected"):
        raise HTTPException(400, f"MOA is already {moa.data['status']}")

    current_step = moa.data["current_step"]
    rejected_at_label = MOA_STEPS[current_step]["label"] if current_step < len(MOA_STEPS) else "Unknown"

    result = supabase.table("moa_requests").update({
        "status": "rejected",
        "rejection_reason": body.reason,
        "rejected_by": current_user["id"],
        "rejected_at_step": rejected_at_label,
        "updated_at": datetime.utcnow().isoformat(),
    }).eq("id", str(moa_id)).execute()

    if not result.data:
        raise HTTPException(500, "Failed to reject MOA")

    return {"message": "MOA rejected", "moa": result.data[0]}
