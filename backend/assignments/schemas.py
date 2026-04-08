from pydantic import BaseModel
from typing import Optional
from datetime import date

class AssignmentBase(BaseModel):
    id: str
    course_id: str
    rubric_version_id: str
    code_language: str
    due_date: str
    assignment_name: str
    assignment_description: Optional[str] = None
    max_files: int
    max_score: Optional[int] = None

    class Config:
        from_attributes = True


class AssignmentListItem(BaseModel):
    id: str
    course_id: str
    assignment_name: str
    assignment_description: Optional[str] = None
    code_language: str
    due_date: date
    max_files: int
    max_score: Optional[int] = None

    class Config:
        from_attributes = True


class SubmissionListItem(BaseModel):
    submission_id: str
    student_id: str
    submitted_at: str
    score: Optional[float] = None
    faculty_reviewed: Optional[bool] = None