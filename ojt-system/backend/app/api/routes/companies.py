from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date
from app.core.security import get_current_user, CoordOrAdmin, AdminOnly
from app.db.database import get_supabase

router = APIRouter(prefix="/companies", tags=["Companies"])


# ── Schemas ───────────────────────────────────────────────────────────────────
class CompanyIn(BaseModel):
    name: str
    industry: Optional[str] = None
    address: Optional[str] = None
    contact_person: Optional[str] = None
    contact_position: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    slot_capacity: int = 0


class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    industry: Optional[str] = None
    address: Optional[str] = None
    contact_person: Optional[str] = None
    contact_position: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    slot_capacity: Optional[int] = None


class AccreditIn(BaseModel):
    notes: Optional[str] = None


# ── List ──────────────────────────────────────────────────────────────────────
@router.get("")
async def list_companies(
    is_accredited: Optional[bool] = None,
    current_user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    query = supabase.table("companies").select("*")
    if is_accredited is not None:
        query = query.eq("is_accredited", is_accredited)
    result = query.order("name").execute()
    return result.data or []


# ── Create ────────────────────────────────────────────────────────────────────
@router.post("", status_code=201)
async def create_company(
    data: CompanyIn,
    current_user=Depends(CoordOrAdmin),
    supabase=Depends(get_supabase),
):
    result = supabase.table("companies").insert(data.model_dump(exclude_none=True)).execute()
    if not result.data:
        raise HTTPException(500, "Failed to create company")
    return result.data[0]


# ── Get one ───────────────────────────────────────────────────────────────────
@router.get("/{company_id}")
async def get_company(
    company_id: str,
    current_user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    result = supabase.table("companies").select("*").eq("id", company_id).single().execute()
    if not result.data:
        raise HTTPException(404, "Company not found")
    return result.data


# ── Update ────────────────────────────────────────────────────────────────────
@router.put("/{company_id}")
async def update_company(
    company_id: str,
    data: CompanyUpdate,
    current_user=Depends(CoordOrAdmin),
    supabase=Depends(get_supabase),
):
    payload = data.model_dump(exclude_none=True)
    if not payload:
        raise HTTPException(400, "Nothing to update")
    result = supabase.table("companies").update(payload).eq("id", company_id).execute()
    if not result.data:
        raise HTTPException(404, "Company not found")
    return result.data[0]


# ── Delete ────────────────────────────────────────────────────────────────────
@router.delete("/{company_id}", status_code=204)
async def delete_company(
    company_id: str,
    current_user=Depends(AdminOnly),
    supabase=Depends(get_supabase),
):
    supabase.table("companies").delete().eq("id", company_id).execute()


# ── Accredit ──────────────────────────────────────────────────────────────────
@router.post("/{company_id}/accredit")
async def accredit_company(
    company_id: str,
    data: AccreditIn = AccreditIn(),
    current_user=Depends(CoordOrAdmin),
    supabase=Depends(get_supabase),
):
    result = supabase.table("companies").update({
        "is_accredited": True,
        "accreditation_date": str(date.today()),
        "accreditation_notes": data.notes,
    }).eq("id", company_id).execute()
    if not result.data:
        raise HTTPException(404, "Company not found")
    return result.data[0]


# ── Revoke accreditation ──────────────────────────────────────────────────────
@router.post("/{company_id}/revoke")
async def revoke_accreditation(
    company_id: str,
    current_user=Depends(CoordOrAdmin),
    supabase=Depends(get_supabase),
):
    result = supabase.table("companies").update({
        "is_accredited": False,
        "accreditation_date": None,
        "accreditation_notes": None,
    }).eq("id", company_id).execute()
    if not result.data:
        raise HTTPException(404, "Company not found")
    return result.data[0]


# ── Slot status ───────────────────────────────────────────────────────────────
@router.get("/{company_id}/slots")
async def get_slots(
    company_id: str,
    current_user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    company = supabase.table("companies").select("name, slot_capacity").eq("id", company_id).single().execute()
    if not company.data:
        raise HTTPException(404, "Company not found")

    occupied = supabase.table("placements").select("id", count="exact").eq("company_id", company_id).eq("ojt_status", "active").execute()
    used = occupied.count or 0
    capacity = company.data["slot_capacity"]

    return {
        "company": company.data["name"],
        "capacity": capacity,
        "occupied": used,
        "available": max(0, capacity - used),
        "is_full": used >= capacity,
    }
