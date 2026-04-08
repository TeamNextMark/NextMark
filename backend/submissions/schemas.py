# Name: GitHub Copilot
# Date: 2026-03-30
# Description: Pydantic schemas for submission API payloads and responses.

from pydantic import BaseModel



class SubmissionGradeUpdateRequest(BaseModel):
    accept_ai_grade: bool = True
    manual_score: float | None = None
    instructor_comments: str | None = None

class SubmissionCreateResponse(BaseModel):
    submission_id: str
    assignment_id: str
    student_id: str
    status: str


class SubmissionStatusResponse(BaseModel):
    submission_id: str
    assignment_id: str
    student_id: str
    submitted_at: str
    status: str
    score: float | None = None
    faculty_reviewed: bool | None = None
    exit_code: int | None = None
    timed_out: bool | None = None
    duration_ms: int | None = None
    stdout: str | None = None
    stderr: str | None = None
    code_filename: str | None = None
    code_preview: str | None = None
    ai_feedback: str | None = None
    ai_confidence: float | None = None
    test_results: list[dict] | None = None
    rubric_breakdown: list[dict] | None = None
    instructor_comments: str | None = None
    accepted_ai_grade: bool | None = None
    ai_recommended_score: float | None = None
