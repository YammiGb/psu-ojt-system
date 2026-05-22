from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from datetime import datetime
from app.core.security import (
    hash_password, verify_password,
    create_access_token, create_refresh_token,
    decode_token, get_current_user
)
from app.db.database import get_supabase
from app.services.portal_scraper import scrape_portal
import uuid

router = APIRouter(prefix="/auth", tags=["Auth"])

PUBLIC_ROLES    = {"student", "supervisor"}
ADMIN_ONLY_ROLES = {"coordinator", "admin"}


class RegisterIn(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str = "student"
    student_number: str = None
    section: str = None


class AdminCreateUserIn(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class RefreshIn(BaseModel):
    refresh_token: str


class PortalVerifyIn(BaseModel):
    student_number: str
    portal_password: str


def _create_user(supabase, user_id, email, password, full_name, role,
                 student_number=None, section=None):
    supabase.table("users").insert({
        "id": user_id,
        "email": email,
        "password_hash": hash_password(password),
        "full_name": full_name,
        "role": role,
        "is_active": True,
    }).execute()

    if role == "student":
        snum = student_number or f"STU-{user_id[:8].upper()}"
        supabase.table("students").insert({
            "user_id": user_id,
            "student_number": snum,
            "program": "IT",
            "section": section or "",
            "required_hours": 480,
            "enrollment_status": "enrolled",
            "has_disqualifying_grade": False,
            "portal_verified": False,
        }).execute()

    if role == "supervisor":
        company = supabase.table("companies").select("id") \
            .eq("contact_email", email).execute()
        if company.data:
            supabase.table("companies") \
                .update({"supervisor_user_id": user_id}) \
                .eq("id", company.data[0]["id"]).execute()


# ── Public register (student & supervisor only) ───────────
@router.post("/register", status_code=201)
async def register(data: RegisterIn, supabase=Depends(get_supabase)):
    if data.role in ADMIN_ONLY_ROLES:
        raise HTTPException(403,
            f"Role '{data.role}' cannot be self-registered. "
            "Contact an administrator.")
    if data.role not in PUBLIC_ROLES:
        raise HTTPException(400, f"Invalid role. Allowed: {sorted(PUBLIC_ROLES)}")
    if len(data.password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters")

    if supabase.table("users").select("id").eq("email", data.email).execute().data:
        raise HTTPException(400, "Email already registered")

    user_id = str(uuid.uuid4())
    _create_user(supabase, user_id, data.email, data.password,
                 data.full_name, data.role, data.student_number, data.section)

    return {
        "access_token":  create_access_token(user_id, data.role),
        "refresh_token": create_refresh_token(user_id, data.role),
        "token_type": "bearer",
        "user": {"id": user_id, "email": data.email,
                 "full_name": data.full_name, "role": data.role},
    }


# ── Admin: create coordinator / admin accounts ────────────
@router.post("/admin/create-user", status_code=201)
async def admin_create_user(
    data: AdminCreateUserIn,
    current_user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    if current_user["role"] != "admin":
        raise HTTPException(403, "Admins only")
    if data.role not in ADMIN_ONLY_ROLES:
        raise HTTPException(400, f"This endpoint is for: {sorted(ADMIN_ONLY_ROLES)}")
    if len(data.password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters")
    if supabase.table("users").select("id").eq("email", data.email).execute().data:
        raise HTTPException(400, "Email already registered")

    user_id = str(uuid.uuid4())
    _create_user(supabase, user_id, data.email, data.password, data.full_name, data.role)

    return {
        "message": f"{data.role.capitalize()} account created successfully",
        "user": {"id": user_id, "email": data.email,
                 "full_name": data.full_name, "role": data.role},
    }


# ── Admin: list all users ─────────────────────────────────
@router.get("/admin/users")
async def list_users(
    current_user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    if current_user["role"] != "admin":
        raise HTTPException(403, "Admins only")
    result = supabase.table("users") \
        .select("id, email, full_name, role, is_active, created_at") \
        .order("created_at", desc=True).execute()
    return result.data or []


# ── Admin: enable / disable a user ───────────────────────
@router.put("/admin/users/{user_id}/toggle")
async def toggle_user(
    user_id: str,
    current_user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    if current_user["role"] != "admin":
        raise HTTPException(403, "Admins only")
    if user_id == current_user["id"]:
        raise HTTPException(400, "Cannot disable your own account")

    user = supabase.table("users").select("is_active") \
        .eq("id", user_id).single().execute()
    if not user.data:
        raise HTTPException(404, "User not found")

    new_status = not user.data["is_active"]
    supabase.table("users").update({"is_active": new_status}) \
        .eq("id", user_id).execute()
    return {"id": user_id, "is_active": new_status}


# ── Login ─────────────────────────────────────────────────
@router.post("/login")
async def login(data: LoginIn, supabase=Depends(get_supabase)):
    result = supabase.table("users").select("*").eq("email", data.email).execute()
    if not result.data:
        raise HTTPException(401, "Invalid email or password")
    user = result.data[0]
    if not verify_password(data.password, user["password_hash"]):
        raise HTTPException(401, "Invalid email or password")
    if not user.get("is_active", True):
        raise HTTPException(403, "Account is disabled")
    return {
        "access_token":  create_access_token(user["id"], user["role"]),
        "refresh_token": create_refresh_token(user["id"], user["role"]),
        "token_type": "bearer",
        "user": {"id": user["id"], "email": user["email"],
                 "full_name": user["full_name"], "role": user["role"]},
    }


# ── Refresh ───────────────────────────────────────────────
@router.post("/refresh")
async def refresh(data: RefreshIn, supabase=Depends(get_supabase)):
    payload = decode_token(data.refresh_token)
    if payload.get("type") != "refresh":
        raise HTTPException(401, "Invalid refresh token")
    result = supabase.table("users").select("id, role, is_active") \
        .eq("id", payload["sub"]).single().execute()
    if not result.data or not result.data.get("is_active", True):
        raise HTTPException(401, "User not found or disabled")
    return {
        "access_token": create_access_token(result.data["id"], result.data["role"]),
        "token_type": "bearer",
    }


# ── Me ────────────────────────────────────────────────────
@router.get("/me")
async def me(current_user=Depends(get_current_user), supabase=Depends(get_supabase)):
    user_data = {
        "id": current_user["id"], "email": current_user["email"],
        "full_name": current_user["full_name"], "role": current_user["role"],
        "is_active": current_user["is_active"],
    }
    
    # For supervisors, include their company information
    # Match by contact_email since supervisor_user_id may not be set yet
    if current_user["role"] == "supervisor":
        try:
            company = supabase.table("companies").select("id, name") \
                .eq("contact_email", current_user["email"]).execute()
            if company.data:
                user_data["company"] = {
                    "id": company.data[0]["id"],
                    "name": company.data[0]["name"]
                }
        except:
            # Silently continue if query fails (column doesn't exist yet)
            pass
    
    return user_data


# ── Portal Verify ─────────────────────────────────────────
@router.post("/verify-portal")
async def verify_portal(
    data: PortalVerifyIn,
    current_user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    if current_user["role"] != "student":
        raise HTTPException(403, "Students only")

    student = supabase.table("students").select("*") \
        .eq("user_id", current_user["id"]).single().execute()
    if not student.data:
        raise HTTPException(404, "Student profile not found")

    scraped = await scrape_portal(data.student_number, data.portal_password)
    if not scraped.success:
        raise HTTPException(400, scraped.error or "Portal verification failed")

    program_hours = {"IT": 480, "ABEL": 400, "Engineering": 240, "Other": 480}
    program = scraped.program or student.data.get("program", "IT")

    update_payload = {
        "student_number": data.student_number, "program": program,
        "required_hours": program_hours.get(program, 480),
        "enrollment_status": "enrolled",
        "has_disqualifying_grade": not scraped.is_eligible,
        "failed_subjects": scraped.failed_subjects,
        "total_subjects": scraped.total_subjects,
        "passed_subjects": scraped.passed_subjects,
        "eligibility_notes": scraped.eligibility_notes,
        "portal_verified": True,
        "portal_verified_at": datetime.utcnow().isoformat(),
    }
    if scraped.gpa is not None:
        update_payload["gpa"] = scraped.gpa
    if scraped.year_level is not None:
        update_payload["year_level"] = scraped.year_level

    supabase.table("students").update(update_payload) \
        .eq("user_id", current_user["id"]).execute()
    if scraped.full_name:
        supabase.table("users").update({"full_name": scraped.full_name}) \
            .eq("id", current_user["id"]).execute()

    return {
        "success": True, "full_name": scraped.full_name,
        "student_number": data.student_number, "program": program,
        "year_level": scraped.year_level, "gpa": scraped.gpa,
        "is_eligible": scraped.is_eligible,
        "total_subjects": scraped.total_subjects,
        "passed_subjects": scraped.passed_subjects,
        "failed_subjects": scraped.failed_subjects,
        "eligibility_notes": scraped.eligibility_notes,
    }
