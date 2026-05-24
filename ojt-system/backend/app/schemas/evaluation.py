from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime


class EvaluationCreate(BaseModel):
    placement_id: UUID
    evaluator_type: str  # 'supervisor' | 'coordinator'
    period: str          # 'midterm' | 'final'
    technical_skills: Optional[float] = None
    work_attitude: Optional[float] = None
    punctuality: Optional[float] = None
    communication: Optional[float] = None
    initiative: Optional[float] = None
    overall_score: float
    remarks: Optional[str] = None


class EvaluationOut(BaseModel):
    id: UUID
    placement_id: UUID
    student_id: UUID
    evaluator_id: UUID
    evaluator_type: str
    period: str
    technical_skills: Optional[float]
    work_attitude: Optional[float]
    punctuality: Optional[float]
    communication: Optional[float]
    initiative: Optional[float]
    overall_score: float
    remarks: Optional[str]
    submitted_at: datetime


class FinalGradeOut(BaseModel):
    id: UUID
    placement_id: UUID
    student_id: UUID
    supervisor_midterm_score: Optional[float]
    supervisor_final_score: Optional[float]
    coordinator_midterm_score: Optional[float]
    coordinator_final_score: Optional[float]
    supervisor_average: Optional[float]
    coordinator_average: Optional[float]
    final_grade: Optional[float]
    portfolio_submitted: bool
    narrative_report_submitted: bool
    portfolio_url: Optional[str]
    portfolio_file_name: Optional[str] = None
    narrative_report_url: Optional[str]
    narrative_report_file_name: Optional[str] = None
    computed_at: Optional[datetime]


class PortfolioSubmit(BaseModel):
    placement_id: UUID
    portfolio_url: Optional[str] = None
    portfolio_file_name: Optional[str] = None
    narrative_report_url: Optional[str] = None
    narrative_report_file_name: Optional[str] = None


class InterventionCreate(BaseModel):
    placement_id: UUID
    intervention_type: str
    description: str
    outcome: Optional[str] = None
    follow_up_date: Optional[str] = None


class InterventionOut(BaseModel):
    id: UUID
    placement_id: UUID
    student_id: UUID
    logged_by: UUID
    intervention_type: str
    description: str
    outcome: Optional[str]
    follow_up_date: Optional[str]
    resolved: bool
    created_at: datetime
