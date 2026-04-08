from __future__ import annotations

import os
import shutil
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from backend.auth.tokens import get_current_user
from backend.database.session import get_db
from backend.models import Assignment, GradingResult, Submission, SystemLog, UsersAccount
from backend.submissions.schemas import SubmissionCreateResponse, SubmissionStatusResponse

router = APIRouter(tags=["submissions"], prefix="/submissions")

SUBMISSIONS_BASE_DIR = Path(os.getenv("SUBMISSIONS_BASE_DIR", "/var/lib/nextmark/submissions"))
HOST_SUBMISSIONS_BASE_DIR = Path(
    os.getenv("HOST_SUBMISSIONS_BASE_DIR", "/srv/nextmark/submissions")
)

MAX_FILES = int(os.getenv("SUBMISSIONS_MAX_FILES", "5"))
MAX_FILE_SIZE_BYTES = int(os.getenv("SUBMISSIONS_MAX_FILE_SIZE_BYTES", str(5 * 1024 * 1024)))


def _allowed_extensions(language: str) -> set[str]:
    lang = (language or "").lower()
    if "python" in lang:
        return {".py"}
    if "cpp" in lang or "c++" in lang:
        return {".cpp", ".cc", ".cxx", ".hpp", ".h"}
    return set()


def _safe_filename(name: str) -> str:
    cleaned = Path(name).name.strip()
    if not cleaned:
        raise ValueError("file name is required")
    if cleaned in {".", ".."}:
        raise ValueError("invalid file name")
    return cleaned


def _ensure_runner_entrypoint(language: str, workspace_path: Path, stored_names: list[str]) -> None:
    lang = (language or "").lower()

    if "python" in lang:
        if "main.py" in stored_names:
            return

        first_source = next(
            (n for n in stored_names if Path(n).suffix.lower() == ".py"),
            None,
        )

        if not first_source:
            raise ValueError("at least one .py file is required")

        shutil.copyfile(workspace_path / first_source, workspace_path / "main.py")
        return

    if "cpp" in lang or "c++" in lang:
        if "main.cpp" in stored_names:
            return

        first_source = next(
            (n for n in stored_names if Path(n).suffix.lower() in {".cpp", ".cc", ".cxx"}),
            None,
        )

        if not first_source:
            raise ValueError("at least one C++ source file is required")

        shutil.copyfile(workspace_path / first_source, workspace_path / "main.cpp")


@router.post("/", response_model=SubmissionCreateResponse, status_code=status.HTTP_201_CREATED)
def create_submission(
    assignment_id: str = Form(...),
    files: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
    claims: dict = Depends(get_current_user),
):
    student_id = claims.get("sub")
    if not student_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing user subject in token")

    user = db.query(UsersAccount).filter(UsersAccount.id == student_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student account not found")

    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")

    if "student" not in (user.position or []):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only students can submit assignments")

    if not files:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="At least one file is required")

    if len(files) > MAX_FILES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Maximum {MAX_FILES} files allowed",
        )

    language = (assignment.code_language or "").strip().lower()
    allowed = _allowed_extensions(language)

    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported assignment language: {assignment.code_language}",
        )

    submission_id = str(uuid.uuid4())

    workspace_path = (SUBMISSIONS_BASE_DIR / submission_id).resolve()
    host_workspace_path = (HOST_SUBMISSIONS_BASE_DIR / submission_id).resolve()

    base_dir = SUBMISSIONS_BASE_DIR.resolve()
    host_base_dir = HOST_SUBMISSIONS_BASE_DIR.resolve()

    if not str(workspace_path).startswith(str(base_dir)):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Invalid workspace path",
        )

    if not str(host_workspace_path).startswith(str(host_base_dir)):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Invalid host workspace path",
        )

    workspace_path.mkdir(parents=True, exist_ok=False)
    stored_names: list[str] = []

    try:
        for upload in files:
            try:
                safe_name = _safe_filename(upload.filename or "")
            except ValueError as exc:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

            suffix = Path(safe_name).suffix.lower()
            if suffix not in allowed:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"File type not allowed for {language}: {safe_name}",
                )

            destination = workspace_path / safe_name
            content = upload.file.read(MAX_FILE_SIZE_BYTES + 1)

            if len(content) > MAX_FILE_SIZE_BYTES:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"File too large: {safe_name} (max {MAX_FILE_SIZE_BYTES} bytes)",
                )

            with destination.open("wb") as out_file:
                out_file.write(content)

            stored_names.append(safe_name)

            print("DEBUG language:", language)
            print("DEBUG stored_names:", stored_names)
            print("DEBUG workspace_path:", workspace_path)
            print("DEBUG host_workspace_path:", host_workspace_path)

        _ensure_runner_entrypoint(language, workspace_path, stored_names)

        submission = Submission(
            id=submission_id,
            assignment_id=assignment_id,
            student_id=student_id,
            encrypted_file_paths={
                "workspace_path": str(workspace_path),
                "host_workspace_path": str(host_workspace_path),
                "files": stored_names,
            },
        )
        db.add(submission)
        db.commit()

    except HTTPException:
        db.rollback()
        shutil.rmtree(workspace_path, ignore_errors=True)
        raise
    except Exception as exc:
        db.rollback()
        shutil.rmtree(workspace_path, ignore_errors=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Submission failed: {exc}",
        )

    return SubmissionCreateResponse(
        submission_id=submission_id,
        assignment_id=assignment_id,
        student_id=student_id,
        status="queued",
    )


@router.get("/{submission_id}", response_model=SubmissionStatusResponse)
def get_submission_status(
    submission_id: str,
    db: Session = Depends(get_db),
    claims: dict = Depends(get_current_user),
):
    current_user_id = claims.get("sub")
    if not current_user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing user subject in token")

    current_user = db.query(UsersAccount).filter(UsersAccount.id == current_user_id).first()
    if not current_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    submission = db.query(Submission).filter(Submission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")

    roles = set(current_user.position or [])
    is_owner = submission.student_id == current_user_id
    is_staff = bool({"faculty", "admin", "ta"}.intersection(roles))
    if not (is_owner or is_staff):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed to view this submission")

    grading = db.query(GradingResult).filter(GradingResult.submission_id == submission_id).first()

    exec_log = (
        db.query(SystemLog)
        .filter(SystemLog.submission_id == submission_id, SystemLog.log_type == "sandbox_execution")
        .order_by(SystemLog.timestamp.desc())
        .first()
    )

    status_value = "queued"
    if exec_log:
        status_value = "completed"

    details = exec_log.details if exec_log and isinstance(exec_log.details, dict) else {}

    return SubmissionStatusResponse(
        submission_id=submission.id,
        assignment_id=submission.assignment_id,
        student_id=submission.student_id,
        submitted_at=submission.submitted_at.isoformat(),
        status=status_value,
        score=float(grading.total_points_earned) if grading else None,
        faculty_reviewed=grading.faculty_reviewed if grading else None,
        exit_code=details.get("exit_code") if details else None,
        timed_out=details.get("timed_out") if details else None,
        duration_ms=details.get("duration_ms") if details else None,
        stdout=details.get("stdout") if details else None,
        stderr=details.get("stderr") if details else None,
    )