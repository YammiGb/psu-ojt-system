from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from app.core.security import get_current_user, CoordOrAdmin
from app.db.database import get_supabase
from uuid import UUID
import uuid as uuid_lib
import mimetypes

router = APIRouter(prefix="/evaluations", tags=["Evaluations"])


# ── Schemas ───────────────────────────────────────────────
class EvaluationCreate(BaseModel):
    placement_id:     UUID
    evaluator_type:   str
    period:           str
    technical_skills: Optional[float] = None
    work_attitude:    Optional[float] = None
    punctuality:      Optional[float] = None
    communication:    Optional[float] = None
    initiative:       Optional[float] = None
    overall_score:    float
    remarks:          Optional[str] = None


class PortfolioSubmit(BaseModel):
    placement_id:              UUID
    portfolio_url:             Optional[str] = None
    portfolio_file_name:       Optional[str] = None
    narrative_report_url:      Optional[str] = None
    narrative_report_file_name: Optional[str] = None


class InterventionCreate(BaseModel):
    placement_id:      UUID
    intervention_type: str
    description:       str
    follow_up_date:    Optional[date] = None


# ── Grade computation ─────────────────────────────────────
def compute_grade(sup_mid, sup_fin, coord_mid, coord_fin):
    sup_scores   = [s for s in [sup_mid, sup_fin]     if s is not None]
    coord_scores = [s for s in [coord_mid, coord_fin] if s is not None]

    sup_avg   = round(sum(sup_scores)   / len(sup_scores),   2) if sup_scores   else None
    coord_avg = round(sum(coord_scores) / len(coord_scores), 2) if coord_scores else None

    if sup_avg is not None and coord_avg is not None:
        final = round((sup_avg * 0.5) + (coord_avg * 0.5), 2)
    elif sup_avg is not None:
        final = sup_avg
    elif coord_avg is not None:
        final = coord_avg
    else:
        final = None

    return sup_avg, coord_avg, final


def recompute_grade(supabase, placement_id: str):
    rows = supabase.table("evaluations").select("*") \
        .eq("placement_id", placement_id).execute().data or []

    sup_mid   = next((r["overall_score"] for r in rows if r["evaluator_type"] == "supervisor"  and r["period"] == "midterm"), None)
    sup_fin   = next((r["overall_score"] for r in rows if r["evaluator_type"] == "supervisor"  and r["period"] == "final"),   None)
    coord_mid = next((r["overall_score"] for r in rows if r["evaluator_type"] == "coordinator" and r["period"] == "midterm"), None)
    coord_fin = next((r["overall_score"] for r in rows if r["evaluator_type"] == "coordinator" and r["period"] == "final"),   None)

    sup_avg, coord_avg, final = compute_grade(sup_mid, sup_fin, coord_mid, coord_fin)

    payload = {
        "placement_id":              placement_id,
        "supervisor_midterm_score":  sup_mid,
        "supervisor_final_score":    sup_fin,
        "supervisor_average":        sup_avg,
        "coordinator_midterm_score": coord_mid,
        "coordinator_final_score":   coord_fin,
        "coordinator_average":       coord_avg,
        "final_grade":               final,
        "computed_at":               datetime.utcnow().isoformat(),
        "updated_at":                datetime.utcnow().isoformat(),
    }

    existing = supabase.table("ojt_grades").select("id") \
        .eq("placement_id", placement_id).execute()

    if existing.data:
        supabase.table("ojt_grades").update(payload).eq("placement_id", placement_id).execute()
    else:
        supabase.table("ojt_grades").insert(payload).execute()


# ── FIXED ROUTE ORDER: specific routes BEFORE /{placement_id} ──

# ── Submit evaluation (coordinator or supervisor) ─────────
@router.post("", status_code=201)
async def submit_evaluation(
    data: EvaluationCreate,
    current_user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    if current_user["role"] == "student":
        raise HTTPException(403, "Students cannot submit evaluations")
    if data.evaluator_type not in ("supervisor", "coordinator"):
        raise HTTPException(400, "evaluator_type must be 'supervisor' or 'coordinator'")
    if data.period not in ("midterm", "final"):
        raise HTTPException(400, "period must be 'midterm' or 'final'")
    if not (0 <= data.overall_score <= 100):
        raise HTTPException(400, "overall_score must be between 0 and 100")

    placement = supabase.table("placements").select("id, ojt_status") \
        .eq("id", str(data.placement_id)).single().execute()
    if not placement.data:
        raise HTTPException(404, "Placement not found")

    existing = supabase.table("evaluations").select("id") \
        .eq("placement_id", str(data.placement_id)) \
        .eq("evaluator_type", data.evaluator_type) \
        .eq("period", data.period).execute()

    payload = {
        "placement_id":    str(data.placement_id),
        "evaluator_type":  data.evaluator_type,
        "period":          data.period,
        "technical_skills": data.technical_skills,
        "work_attitude":   data.work_attitude,
        "punctuality":     data.punctuality,
        "communication":   data.communication,
        "initiative":      data.initiative,
        "overall_score":   data.overall_score,
        "remarks":         data.remarks,
        "submitted_by":    current_user["id"],
        "updated_at":      datetime.utcnow().isoformat(),
    }

    if existing.data:
        result = supabase.table("evaluations").update(payload) \
            .eq("id", existing.data[0]["id"]).execute()
    else:
        result = supabase.table("evaluations").insert(payload).execute()

    if not result.data:
        raise HTTPException(500, "Failed to save evaluation")

    recompute_grade(supabase, str(data.placement_id))
    return result.data[0]


# ── Portfolio submit ──────────────────────────────────────
@router.post("/portfolio")
async def submit_portfolio(
    data: PortfolioSubmit,
    current_user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    update = {"updated_at": datetime.utcnow().isoformat()}
    if data.portfolio_url:
        update["portfolio_url"]        = data.portfolio_url
        update["portfolio_file_name"]  = data.portfolio_file_name
        update["portfolio_submitted"]  = True
    if data.narrative_report_url:
        update["narrative_report_url"]          = data.narrative_report_url
        update["narrative_report_file_name"]    = data.narrative_report_file_name
        update["narrative_report_submitted"]    = True

    existing = supabase.table("ojt_grades").select("id") \
        .eq("placement_id", str(data.placement_id)).execute()

    try:
        if existing.data:
            result = supabase.table("ojt_grades").update(update) \
                .eq("placement_id", str(data.placement_id)).execute()
        else:
            update["placement_id"] = str(data.placement_id)
            result = supabase.table("ojt_grades").insert(update).execute()
    except Exception as e:
        # Fallback if the file_name columns don't exist in the DB schema yet
        if any(col in str(e) or "PGRST204" in str(e) for col in ("portfolio_file_name", "narrative_report_file_name")):
            update.pop("portfolio_file_name", None)
            update.pop("narrative_report_file_name", None)
            if existing.data:
                result = supabase.table("ojt_grades").update(update) \
                    .eq("placement_id", str(data.placement_id)).execute()
            else:
                update["placement_id"] = str(data.placement_id)
                result = supabase.table("ojt_grades").insert(update).execute()
        else:
            raise e

    if not result.data:
        raise HTTPException(500, "Failed to update portfolio")
    return result.data[0]


# ── Upload final deliverables ─────────────────────────────
PORTFOLIO_BUCKET = "portfolio-files"

@router.post("/upload-file")
async def upload_portfolio_file(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    """Upload a portfolio or narrative report to Supabase Storage.
    Returns { file_url, file_name } to be stored with the portfolio grade.
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

    # Build a unique storage path: <user_id>/<uuid>_<filename>
    safe_name = (file.filename or "document").replace(" ", "_")
    storage_path = f"{current_user['id']}/{uuid_lib.uuid4()}_{safe_name}"

    try:
        supabase.storage.from_(PORTFOLIO_BUCKET).upload(
            path=storage_path,
            file=contents,
            file_options={"content-type": content_type},
        )
    except Exception as e:
        raise HTTPException(500, f"File upload failed: {str(e)}")

    public_url = supabase.storage.from_(PORTFOLIO_BUCKET).get_public_url(storage_path)

    return {
        "file_url":  public_url,
        "file_name": file.filename,
    }


# ── Log intervention ──────────────────────────────────────
@router.post("/interventions", status_code=201)
async def log_intervention(
    data: InterventionCreate,
    current_user=Depends(CoordOrAdmin),
    supabase=Depends(get_supabase),
):
    result = supabase.table("interventions").insert({
        "placement_id":      str(data.placement_id),
        "intervention_type": data.intervention_type,
        "description":       data.description,
        "follow_up_date":    str(data.follow_up_date) if data.follow_up_date else None,
        "logged_by":         current_user["id"],
    }).execute()

    if not result.data:
        raise HTTPException(500, "Failed to log intervention")
    return result.data[0]


# ── Get interventions — BEFORE /{placement_id} ───────────
@router.get("/interventions/{placement_id}")
async def get_interventions(
    placement_id: UUID,
    current_user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    result = supabase.table("interventions").select("*") \
        .eq("placement_id", str(placement_id)) \
        .order("created_at", desc=True).execute()
    return result.data or []


# ── Supervisor: list their own interns ────────────────────
@router.get("/my-interns")
async def get_my_interns(
    current_user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    """Supervisor sees placements at their company."""
    if current_user["role"] not in ("supervisor", "coordinator", "admin"):
        raise HTTPException(403, "Access denied")

    # Find company linked to this supervisor by contact_email
    company = supabase.table("companies").select("id, name") \
        .ilike("contact_email", current_user["email"]).execute()

    if not company.data:
        # Fallback: find placements where supervisor submitted eval
        evals = supabase.table("evaluations").select("placement_id") \
            .eq("submitted_by", current_user["id"]).execute()
        placement_ids = list({e["placement_id"] for e in (evals.data or [])})
        if not placement_ids:
            return []
        result = supabase.table("placements").select(
            "*, students(student_number, section, program, users(full_name, email)), companies(name)"
        ).in_("id", placement_ids).eq("ojt_status", "active").execute()
    else:
        company_id = company.data[0]["id"]
        result = supabase.table("placements").select(
            "*, students(student_number, section, program, users(full_name, email)), companies(name)"
        ).eq("company_id", company_id).eq("ojt_status", "active").execute()

    return result.data or []


# ── Get grade — BEFORE /{placement_id} ───────────────────
@router.get("/{placement_id}/grade")
async def get_grade(
    placement_id: UUID,
    current_user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    result = supabase.table("ojt_grades").select("*") \
        .eq("placement_id", str(placement_id)).execute()

    # Use .execute() without .single() to avoid 500 when row missing
    if not result.data:
        return {
            "placement_id":              str(placement_id),
            "final_grade":               None,
            "supervisor_average":        None,
            "coordinator_average":       None,
            "supervisor_midterm_score":  None,
            "supervisor_final_score":    None,
            "coordinator_midterm_score": None,
            "coordinator_final_score":   None,
            "portfolio_submitted":       False,
            "portfolio_url":             None,
            "portfolio_file_name":       None,
            "narrative_report_submitted": False,
            "narrative_report_url":      None,
            "narrative_report_file_name": None,
            "computed_at":               None,
        }
    return result.data[0]


# ── Get all evaluations for a placement ──────────────────
@router.get("/{placement_id}")
async def get_evaluations(
    placement_id: UUID,
    current_user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    result = supabase.table("evaluations").select("*") \
        .eq("placement_id", str(placement_id)) \
        .order("created_at").execute()
    return result.data or []
