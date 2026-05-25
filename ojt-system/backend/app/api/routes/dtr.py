from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import date, time, datetime
from app.core.security import get_current_user, CoordOrAdmin
from app.db.database import get_supabase
from uuid import UUID

router = APIRouter(prefix="/dtr", tags=["DTR / Hours"])


# ── Schemas ───────────────────────────────────────────────
class DTRCreate(BaseModel):
    placement_id: UUID
    log_date: date
    time_in: time
    time_out: time
    dtr_type: str = "manual"   # manual | biometric | school_dtr
    remarks: Optional[str] = None


# ── Log a DTR entry (student) ─────────────────────────────
@router.post("", status_code=201)
async def log_dtr(
    data: DTRCreate,
    current_user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    # 1. Verify placement exists and belongs to this student
    placement = supabase.table("placements").select(
        "id, student_id, ojt_status, semester, academic_year, students(user_id, required_hours)"
    ).eq("id", str(data.placement_id)).single().execute()

    if not placement.data:
        raise HTTPException(404, "Placement not found")

    p = placement.data

    if current_user["role"] == "student":
        if p["students"]["user_id"] != current_user["id"]:
            raise HTTPException(403, "Not your placement")

    if p["ojt_status"] != "active":
        raise HTTPException(400, f"Placement is not active (status: {p['ojt_status']})")

    # 2. Calculate hours
    ti = datetime.combine(data.log_date, data.time_in)
    to = datetime.combine(data.log_date, data.time_out)
    diff = (to - ti).total_seconds() / 3600

    if diff <= 0:
        raise HTTPException(400, "Time out must be after time in")
    if diff > 12:
        raise HTTPException(400, "Cannot log more than 12 hours in a single day")

    hours = round(diff, 2)

    # 3. Check won't exceed required hours
    existing = supabase.table("dtr_logs").select("hours_rendered") \
        .eq("placement_id", str(data.placement_id)).execute()
    total_so_far = sum(r["hours_rendered"] for r in (existing.data or []))
    required = p["students"]["required_hours"]

    if total_so_far + hours > required:
        remaining = round(required - total_so_far, 2)
        raise HTTPException(400, f"Only {remaining}h remaining. Cannot log {hours}h.")

    # 4. Check no duplicate for same date
    dup = supabase.table("dtr_logs").select("id") \
        .eq("placement_id", str(data.placement_id)) \
        .eq("log_date", str(data.log_date)).execute()
    if dup.data:
        raise HTTPException(409, f"DTR already logged for {data.log_date}")

    # 5. Insert
    result = supabase.table("dtr_logs").insert({
        "placement_id": str(data.placement_id),
        "student_id":   str(p["student_id"]),
        "log_date":     str(data.log_date),
        "time_in":      str(data.time_in),
        "time_out":     str(data.time_out),
        "hours_rendered": hours,
        "dtr_type":     data.dtr_type,
        "remarks":      data.remarks,
    }).execute()

    if not result.data:
        raise HTTPException(500, "Failed to save DTR entry")

    return result.data[0]


# ── Get DTR logs for a placement ──────────────────────────
@router.get("/{placement_id}")
async def get_dtr_logs(
    placement_id: UUID,
    current_user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    placement = supabase.table("placements").select(
        "student_id, students(user_id, required_hours)"
    ).eq("id", str(placement_id)).single().execute()

    if not placement.data:
        raise HTTPException(404, "Placement not found")

    if current_user["role"] == "student":
        if placement.data["students"]["user_id"] != current_user["id"]:
            raise HTTPException(403, "Access denied")

    logs = supabase.table("dtr_logs").select("*") \
        .eq("placement_id", str(placement_id)) \
        .order("log_date", desc=True).execute()

    rows = logs.data or []
    total_rendered = round(sum(r["hours_rendered"] for r in rows), 2)
    required = placement.data["students"]["required_hours"]

    return {
        "logs": rows,
        "summary": {
            "total_rendered": total_rendered,
            "required":       required,
            "remaining":      round(max(0, required - total_rendered), 2),
            "percentage":     round(min(100, (total_rendered / required) * 100), 1) if required > 0 else 0,
        }
    }


# ── Verify a DTR entry (coordinator/admin) ────────────────
@router.put("/{dtr_id}/verify")
async def verify_dtr(
    dtr_id: UUID,
    current_user=Depends(CoordOrAdmin),
    supabase=Depends(get_supabase),
):
    result = supabase.table("dtr_logs").update({
        "verified":    True,
        "verified_by": current_user["id"],
        "verified_at": datetime.utcnow().isoformat(),
    }).eq("id", str(dtr_id)).execute()

    if not result.data:
        raise HTTPException(404, "DTR entry not found")

    return result.data[0]


# ── Delete a DTR entry (student can delete own unverified) ─
@router.delete("/{dtr_id}", status_code=204)
async def delete_dtr(
    dtr_id: UUID,
    current_user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    entry = supabase.table("dtr_logs").select(
        "id, verified, placements(students(user_id))"
    ).eq("id", str(dtr_id)).single().execute()

    if not entry.data:
        raise HTTPException(404, "DTR entry not found")

    if current_user["role"] == "student":
        owner = entry.data["placements"]["students"]["user_id"]
        if owner != current_user["id"]:
            raise HTTPException(403, "Not your entry")
        if entry.data["verified"]:
            raise HTTPException(400, "Cannot delete a verified entry")

    supabase.table("dtr_logs").delete().eq("id", str(dtr_id)).execute()
