from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import date, time


class RubricCriterionCreate(BaseModel):
    criterion: str
    max: int = Field(gt=0)
    description: Optional[str] = None


class AssignmentCreate(BaseModel):
    course_id: str
    assignment_name: str
    assignment_description: Optional[str] = None
    code_language: str
    due_date: date
    due_time: time
    max_files: int = Field(default=1, ge=1)
    rubric_items: list[RubricCriterionCreate]

    @field_validator("code_language")
    @classmethod
    def validate_language(cls, value: str):
        normalized = value.strip().lower()
        if normalized not in {"python", "c++", "cpp"}:
            raise ValueError("code_language must be Python or C++")
        return "cpp" if normalized == "c++" else normalized

    @field_validator("rubric_items")
    @classmethod
    def validate_rubric_items(cls, value: list[RubricCriterionCreate]):
        if not value:
            raise ValueError("At least one rubric item is required")
        return value


class AssignmentBase(BaseModel):
    id: str
    course_id: str
    rubric_version_id: str
    code_language: str
    due_date: date
    due_time: time
    assignment_name: str
    assignment_description: Optional[str] = None
    max_files: int
    max_score: Optional[int] = None

    class Config:
        from_attributes = True


class AssignmentDetail(AssignmentBase):
    rubric_items: list[dict] = []

    class Config:
        from_attributes = True


class AssignmentListItem(BaseModel):
    id: str
    course_id: str
    assignment_name: str
    assignment_description: Optional[str] = None
    code_language: str
    due_date: date
    due_time: time
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