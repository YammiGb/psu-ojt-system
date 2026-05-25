from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date
from app.core.security import get_current_user, CoordOrAdmin
from app.db.database import get_supabase

router = APIRouter(prefix="/placements", tags=["Placements"])


# ── Schemas ───────────────────────────────────────────────────────────────────
class PlacementIn(BaseModel):
    student_id: str
    company_id: str
    application_id: Optional[str] = None
    semester: str
    academic_year: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class StatusUpdate(BaseModel):
    ojt_status: str


class TransferIn(BaseModel):
    to_company_id: str
    reason: str


class TransferReview(BaseModel):
    approved: bool
    rejection_reason: Optional[str] = None


# ── Assign student to company (coordinator) ───────────────────────────────────
@router.post("", status_code=201)
async def assign_student(
    data: PlacementIn,
    current_user=Depends(CoordOrAdmin),
    supabase=Depends(get_supabase),
):
    # Check company exists and is accredited
    company = supabase.table("companies").select("*").eq("id", data.company_id).single().execute()
    if not company.data:
        raise HTTPException(404, "Company not found")
    if not company.data["is_accredited"]:
        raise HTTPException(400, "Company is not accredited — cannot place students here")

    # Check slot capacity
    active = supabase.table("placements").select("id", count="exact").eq(
        "company_id", data.company_id
    ).eq("ojt_status", "active").execute()
    used = active.count or 0
    if used >= company.data["slot_capacity"]:
        raise HTTPException(400, f"Company is full — {used}/{company.data['slot_capacity']} slots used")

    # Check student not already placed this semester
    existing = supabase.table("placements").select("id").eq(
        "student_id", data.student_id
    ).eq("semester", data.semester).eq("academic_year", data.academic_year).execute()
    if existing.data:
        raise HTTPException(400, "Student already has a placement this semester")

    # Clean application_id if it's empty string
    app_id = data.application_id if (data.application_id and data.application_id.strip() != "") else None

    payload = {
        "student_id":     data.student_id,
        "company_id":     data.company_id,
        "application_id": app_id,
        "semester":       data.semester,
        "academic_year":  data.academic_year,
        "ojt_status":     "active",
        "assigned_by":    current_user["id"],
    }
    if data.start_date:
        payload["start_date"] = str(data.start_date)
    if data.end_date:
        payload["end_date"] = str(data.end_date)

    result = supabase.table("placements").insert(payload).execute()
    if not result.data:
        raise HTTPException(500, "Failed to create placement")

    # Mark application as approved if linked
    if app_id:
        supabase.table("ojt_applications").update({
            "status":      "approved",
            "reviewed_by": current_user["id"],
            "reviewed_at": datetime.utcnow().isoformat(),
        }).eq("id", app_id).execute()

    return result.data[0]


# ── List ──────────────────────────────────────────────────────────────────────
@router.get("")
async def list_placements(
    ojt_status: Optional[str] = None,
    semester: Optional[str] = None,
    academic_year: Optional[str] = None,
    current_user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    if current_user["role"] == "student":
        student = supabase.table("students").select("id").eq(
            "user_id", current_user["id"]
        ).single().execute()
        if not student.data:
            return []
        query = supabase.table("placements").select(
            "*, companies(name, address, contact_person)"
        ).eq("student_id", student.data["id"])
    else:
        query = supabase.table("placements").select(
            "*, companies(name), students(student_number, section, program, users!students_user_id_fkey(full_name))"
        )

    if ojt_status:
        query = query.eq("ojt_status", ojt_status)
    if semester:
        query = query.eq("semester", semester)
    if academic_year:
        query = query.eq("academic_year", academic_year)

    result = query.order("created_at", desc=True).execute()
    return result.data or []


# ── Get one ───────────────────────────────────────────────────────────────────
@router.get("/{placement_id}")
async def get_placement(
    placement_id: str,
    current_user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    result = supabase.table("placements").select(
        "*, companies(name, address, contact_person, contact_email, contact_phone), students(student_number, program, section, users!students_user_id_fkey(full_name))"
    ).eq("id", placement_id).single().execute()

    if not result.data:
        raise HTTPException(404, "Placement not found")

    # Students can only see their own
    if current_user["role"] == "student":
        student = supabase.table("students").select("id").eq(
            "user_id", current_user["id"]
        ).single().execute()
        if not student.data or result.data["student_id"] != student.data["id"]:
            raise HTTPException(403, "Access denied")

    return result.data


# ── Update status ─────────────────────────────────────────────────────────────
@router.put("/{placement_id}/status")
async def update_status(
    placement_id: str,
    data: StatusUpdate,
    current_user=Depends(CoordOrAdmin),
    supabase=Depends(get_supabase),
):
    valid = {"active", "completed", "not_completed", "transferred", "withdrawn"}
    if data.ojt_status not in valid:
        raise HTTPException(400, f"Status must be one of {valid}")

    result = supabase.table("placements").update({
        "ojt_status": data.ojt_status,
        "updated_at": datetime.utcnow().isoformat(),
    }).eq("id", placement_id).execute()

    if not result.data:
        raise HTTPException(404, "Placement not found")
    return result.data[0]


# ── Request transfer ──────────────────────────────────────────────────────────
@router.post("/{placement_id}/transfer")
async def request_transfer(
    placement_id: str,
    data: TransferIn,
    current_user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    placement = supabase.table("placements").select("*").eq(
        "id", placement_id
    ).single().execute()
    if not placement.data:
        raise HTTPException(404, "Placement not found")

    p = placement.data

    # Students can only request transfer for their own placement
    if current_user["role"] == "student":
        student = supabase.table("students").select("id").eq(
            "user_id", current_user["id"]
        ).single().execute()
        if not student.data or p["student_id"] != student.data["id"]:
            raise HTTPException(403, "Not your placement")

    if p["ojt_status"] != "active":
        raise HTTPException(400, "Can only transfer an active placement")

    # Check no pending transfer already
    pending = supabase.table("transfers").select("id").eq(
        "placement_id", placement_id
    ).eq("status", "pending").execute()
    if pending.data:
        raise HTTPException(400, "A transfer request is already pending")

    result = supabase.table("transfers").insert({
        "placement_id":   placement_id,
        "from_company_id": p["company_id"],
        "to_company_id":  data.to_company_id,
        "reason":         data.reason,
    }).execute()

    return result.data[0]


# ── List transfers (coordinator) ──────────────────────────────────────────────
@router.get("/transfers/all")
async def list_transfers(
    current_user=Depends(CoordOrAdmin),
    supabase=Depends(get_supabase),
):
    result = supabase.table("transfers").select(
        "*, placements(students(users!students_user_id_fkey(full_name), student_number)), "
        "from_company:companies!transfers_from_company_id_fkey(name), "
        "to_company:companies!transfers_to_company_id_fkey(name)"
    ).order("created_at", desc=True).execute()
    return result.data or []


# ── Review transfer (coordinator) ─────────────────────────────────────────────
@router.put("/transfers/{transfer_id}/review")
async def review_transfer(
    transfer_id: str,
    data: TransferReview,
    current_user=Depends(CoordOrAdmin),
    supabase=Depends(get_supabase),
):
    transfer = supabase.table("transfers").select("*").eq(
        "id", transfer_id
    ).single().execute()
    if not transfer.data:
        raise HTTPException(404, "Transfer not found")

    t = transfer.data
    if t["status"] != "pending":
        raise HTTPException(400, f"Transfer is already {t['status']}")

    new_status = "approved" if data.approved else "rejected"

    supabase.table("transfers").update({
        "status":           new_status,
        "approved_by":      current_user["id"],
        "approved_at":      datetime.utcnow().isoformat(),
        "rejection_reason": data.rejection_reason,
    }).eq("id", transfer_id).execute()

    if data.approved:
        # Update placement company
        supabase.table("placements").update({
            "company_id": t["to_company_id"],
            "ojt_status": "active",
            "updated_at": datetime.utcnow().isoformat(),
        }).eq("id", t["placement_id"]).execute()

    return {"message": f"Transfer {new_status}"}
