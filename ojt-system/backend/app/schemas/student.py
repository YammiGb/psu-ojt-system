from pydantic import BaseModel, EmailStr
from typing import Optional
from uuid import UUID
from datetime import datetime


class StudentCreate(BaseModel):
    student_number: str
    program: str
    section: Optional[str] = None
    year_level: Optional[int] = None
    gpa: Optional[float] = None
    has_disqualifying_grade: bool = False
    enrollment_status: str = "enrolled"
    advisor_id: Optional[UUID] = None


class StudentUpdate(BaseModel):
    section: Optional[str] = None
    year_level: Optional[int] = None
    gpa: Optional[float] = None
    has_disqualifying_grade: Optional[bool] = None
    enrollment_status: Optional[str] = None
    advisor_id: Optional[UUID] = None


class StudentOut(BaseModel):
    id: UUID
    user_id: UUID
    student_number: str
    program: str
    section: Optional[str]
    year_level: Optional[int]
    required_hours: int
    enrollment_status: str
    gpa: Optional[float]
    has_disqualifying_grade: bool
    advisor_id: Optional[UUID]
    created_at: datetime


class EligibilityResult(BaseModel):
    student_id: UUID
    is_eligible: bool
    reasons: list[str]
