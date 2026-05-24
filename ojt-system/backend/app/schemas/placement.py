from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime, date


class ApplicationCreate(BaseModel):
    company_id: Optional[UUID] = None
    semester: str
    academic_year: str
    consent_form_url: Optional[str] = None
    endorsement_letter_url: Optional[str] = None
    parent_consent_url: Optional[str] = None
    other_docs_urls: List[str] = []


class ApplicationUpdate(BaseModel):
    company_id: Optional[UUID] = None
    status: Optional[str] = None
    rejection_reason: Optional[str] = None
    consent_form_url: Optional[str] = None
    endorsement_letter_url: Optional[str] = None
    parent_consent_url: Optional[str] = None


class ApplicationOut(BaseModel):
    id: UUID
    student_id: UUID
    company_id: Optional[UUID]
    semester: str
    academic_year: str
    status: str
    consent_form_url: Optional[str]
    endorsement_letter_url: Optional[str]
    parent_consent_url: Optional[str]
    other_docs_urls: List[str]
    rejection_reason: Optional[str]
    reviewed_by: Optional[UUID]
    reviewed_at: Optional[datetime]
    created_at: datetime


class PlacementCreate(BaseModel):
    student_id: UUID
    company_id: UUID
    application_id: Optional[UUID] = None
    semester: str
    academic_year: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class PlacementOut(BaseModel):
    id: UUID
    student_id: UUID
    company_id: UUID
    semester: str
    academic_year: str
    ojt_status: str
    start_date: Optional[date]
    end_date: Optional[date]
    assigned_by: Optional[UUID]
    assigned_at: datetime
    created_at: datetime


class TransferCreate(BaseModel):
    placement_id: UUID
    to_company_id: UUID
    reason: str


class TransferOut(BaseModel):
    id: UUID
    placement_id: UUID
    from_company_id: UUID
    to_company_id: UUID
    reason: str
    status: str
    approved_by: Optional[UUID]
    approved_at: Optional[datetime]
    rejection_reason: Optional[str]
    created_at: datetime
