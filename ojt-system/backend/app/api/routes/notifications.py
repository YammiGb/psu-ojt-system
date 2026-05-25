from fastapi import APIRouter, Depends, HTTPException
from app.core.security import get_current_user, require_roles
from app.db.supabase import get_supabase
from uuid import UUID

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("")
async def get_my_notifications(
    is_read: bool = None,
    current_user=Depends(get_current_user),
    supabase=Depends(get_supabase)
):
    query = supabase.table("notifications").select("*").eq("user_id", current_user["id"])
    if is_read is not None:
        query = query.eq("is_read", is_read)
    result = query.order("created_at", desc=True).limit(50).execute()
    return result.data


@router.put("/{notification_id}/read")
async def mark_read(
    notification_id: UUID,
    current_user=Depends(get_current_user),
    supabase=Depends(get_supabase)
):
    result = supabase.table("notifications").update({"is_read": True}).eq("id", str(notification_id)).eq("user_id", current_user["id"]).execute()
    if not result.data:
        raise HTTPException(404, "Notification not found")
    return {"message": "Marked as read"}


@router.put("/read-all")
async def mark_all_read(
    current_user=Depends(get_current_user),
    supabase=Depends(get_supabase)
):
    supabase.table("notifications").update({"is_read": True}).eq("user_id", current_user["id"]).eq("is_read", False).execute()
    return {"message": "All notifications marked as read"}


@router.get("/unread-count")
async def unread_count(
    current_user=Depends(get_current_user),
    supabase=Depends(get_supabase)
):
    result = supabase.table("notifications").select("id").eq("user_id", current_user["id"]).eq("is_read", False).execute()
    return {"count": len(result.data or [])}


# Background notification triggers (called internally)
async def send_notification(supabase, user_id: str, title: str, message: str, type: str = "info", related_table: str = None, related_id: str = None):
    supabase.table("notifications").insert({
        "user_id": user_id,
        "title": title,
        "message": message,
        "type": type,
        "related_table": related_table,
        "related_id": related_id
    }).execute()
