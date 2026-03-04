from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, Field


class SandboxJob(BaseModel):
    submission_id: str
    assignment_id: str
    student_id: str
    language: str = Field(pattern="^(python|cpp)$")
    encrypted_file_paths: dict
    queued_at: datetime


class SandboxExecutionResult(BaseModel):
    submission_id: str
    exit_code: int
    stdout: str
    stderr: str
    duration_ms: int
    timed_out: bool
    completed_at: datetime
