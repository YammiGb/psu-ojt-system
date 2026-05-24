from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime, date, time


class DTRCreate(BaseModel):
    placement_id: UUID
    log_date: date
    time_in: Optional[time] = None
    time_out: Optional[time] = None
    dtr_type: str = "manual"
    remarks: Optional[str] = None


class DTROut(BaseModel):
    id: UUID
    placement_id: UUID
    student_id: UUID
    log_date: date
    time_in: Optional[time]
    time_out: Optional[time]
    hours_rendered: float
    dtr_type: str
    remarks: Optional[str]
    verified: bool
    created_at: datetime


class WeeklyReportCreate(BaseModel):
    placement_id: UUID
    week_number: int
    week_start: date
    week_end: date
    accomplishments: str
    challenges: Optional[str] = None
    learnings: Optional[str] = None
    file_url: Optional[str] = None


class WeeklyReportUpdate(BaseModel):
    status: Optional[str] = None
    coordinator_remarks: Optional[str] = None


class WeeklyReportOut(BaseModel):
    id: UUID
    placement_id: UUID
    student_id: UUID
    week_number: int
    week_start: date
    week_end: date
    accomplishments: str
    challenges: Optional[str]
    learnings: Optional[str]
    file_url: Optional[str]
    status: str
    acknowledged_by: Optional[UUID]
    acknowledged_at: Optional[datetime]
    coordinator_remarks: Optional[str]
    created_at: datetime


class SiteVisitCreate(BaseModel):
    placement_id: UUID
    company_id: UUID
    scheduled_date: date
    visit_notes: Optional[str] = None


class SiteVisitUpdate(BaseModel):
    actual_date: Optional[date] = None
    status: Optional[str] = None
    visit_notes: Optional[str] = None
    company_notified: Optional[bool] = None


class SiteVisitOut(BaseModel):
    id: UUID
    placement_id: UUID
    company_id: UUID
    coordinator_id: UUID
    scheduled_date: date
    actual_date: Optional[date]
    status: str
    visit_notes: Optional[str]
    company_notified: bool
    notified_at: Optional[datetime]
    created_at: datetime
