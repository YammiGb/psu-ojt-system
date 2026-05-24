from pydantic import BaseModel, EmailStr
from typing import Optional
from uuid import UUID
from datetime import datetime


class CompanyCreate(BaseModel):
    name: str
    industry: Optional[str] = None
    address: Optional[str] = None
    contact_person: Optional[str] = None
    contact_position: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    slot_capacity: int = 0
    supervisor_user_id: Optional[UUID] = None


class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    industry: Optional[str] = None
    address: Optional[str] = None
    contact_person: Optional[str] = None
    contact_position: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    slot_capacity: Optional[int] = None
    is_accredited: Optional[bool] = None
    accreditation_date: Optional[str] = None
    accreditation_notes: Optional[str] = None
    supervisor_user_id: Optional[UUID] = None


class CompanyOut(BaseModel):
    id: UUID
    name: str
    industry: Optional[str]
    address: Optional[str]
    contact_person: Optional[str]
    contact_position: Optional[str]
    contact_email: Optional[str]
    contact_phone: Optional[str]
    slot_capacity: int
    is_accredited: bool
    accreditation_date: Optional[str]
    accreditation_notes: Optional[str]
    supervisor_user_id: Optional[UUID]
    created_at: datetime
