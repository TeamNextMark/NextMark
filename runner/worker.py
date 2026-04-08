from __future__ import annotations

import json
import os
import re
import time
from datetime import datetime, timezone
from pathlib import Path

import docker
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from job_contract import SandboxExecutionResult, SandboxJob

DATABASE_URL = os.getenv("DATABASE_URL")
POLL_INTERVAL_SECONDS = int(os.getenv("RUNNER_POLL_INTERVAL_SECONDS", "5"))

# Path visible inside backend/runner containers
WORKSPACE_BASE_DIR = Path(
    os.getenv("RUNNER_WORKSPACE_BASE_DIR", "/var/lib/nextmark/submissions")
)

# Real host path used by Docker bind mounts
HOST_WORKSPACE_BASE_DIR = Path(
    os.getenv("HOST_SUBMISSIONS_BASE_DIR", "/srv/nextmark/submissions")
)

PYTHON_IMAGE = os.getenv("RUNNER_SANDBOX_PYTHON_IMAGE", "nextmark-sandbox-python:latest")
CPP_IMAGE = os.getenv("RUNNER_SANDBOX_CPP_IMAGE", "nextmark-sandbox-cpp:latest")

CPU_LIMIT = float(os.getenv("RUNNER_CPU_LIMIT", "0.5"))
MEMORY_LIMIT = os.getenv("RUNNER_MEMORY_LIMIT", "256m")
PIDS_LIMIT = int(os.getenv("RUNNER_PIDS_LIMIT", "64"))
TIMEOUT_SECONDS = int(os.getenv("RUNNER_TIMEOUT_SECONDS", "10"))
TMPFS_SIZE = os.getenv("RUNNER_SANDBOX_TMPFS_SIZE", "64m")
APPARMOR_PROFILE = os.getenv("RUNNER_APPARMOR_PROFILE", "")
SECCOMP_PROFILE = os.getenv("RUNNER_SECCOMP_PROFILE", "")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is required for runner worker")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
docker_client = docker.from_env()


def _safe_float(value, default=0.0):
    try:
        return float(value)
    except (TypeError, ValueError):
        return float(default)


def _normalize_rubric_item(item, index=0):
    if not isinstance(item, dict):
        return None

    criterion = (
        item.get("criterion")
        or item.get("name")
        or item.get("title")
        or item.get("label")
        or f"Criterion {index + 1}"
    )

    max_points = (
        item.get("max")
        or item.get("points")
        or item.get("max_points")
        or item.get("score")
        or 0
    )

    return {
        "criterion": str(criterion).strip(),
        "max": _safe_float(max_points, 0),
    }


def _parse_rubric_line_items(line_items):
    """
    Supports:
    1) list of dicts:
       [{"criterion":"Correctness","max":60},{"criterion":"Style","max":40}]

    2) single dict:
       {"criterion":"Correctness","max":100}

    3) wrapped dict:
       {"items":[{"criterion":"Correctness","max":60},{"criterion":"Style","max":40}]}

    4) JSON string of any of the above

    5) plain text fallback like:
       "Correctness: 60 pts, Style: 40 pts"
    """
    if not line_items:
        return []

    # Case 1: already a list
    if isinstance(line_items, list):
        parsed = []
        for idx, item in enumerate(line_items):
            normalized = _normalize_rubric_item(item, idx)
            if normalized:
                parsed.append(normalized)
        return parsed

    # Case 2 or 3: dict
    if isinstance(line_items, dict):
        if isinstance(line_items.get("items"), list):
            parsed = []
            for idx, item in enumerate(line_items["items"]):
                normalized = _normalize_rubric_item(item, idx)
                if normalized:
                    parsed.append(normalized)
            return parsed

        normalized = _normalize_rubric_item(line_items, 0)
        return [normalized] if normalized else []

    # Case 4 or 5: string
    if isinstance(line_items, str):
        raw = line_items.strip()

        if not raw:
            return []

        # First try to decode as JSON
        try:
            decoded = json.loads(raw)
            return _parse_rubric_line_items(decoded)
        except Exception:
            pass

        # Fallback: parse "Criterion: 10 pts, Style: 20 pts"
        items = []
        parts = [p.strip() for p in raw.split(",") if p.strip()]
        for idx, part in enumerate(parts):
            match = re.match(r"(.+?):\s*(\d+(?:\.\d+)?)\s*pts?", part, re.IGNORECASE)
            if match:
                items.append(
                    {
                        "criterion": match.group(1).strip(),
                        "max": _safe_float(match.group(2), 0),
                    }
                )
        return items

    return []


def _build_job(row) -> SandboxJob:
    file_paths = row.file_paths
    if isinstance(file_paths, str):
        file_paths = json.loads(file_paths)

    return SandboxJob(
        submission_id=row.submission_id,
        assignment_id=row.assignment_id,
        student_id=row.student_id,
        language=(row.code_language or "").lower(),
        file_paths=file_paths,
        queued_at=datetime.now(timezone.utc),
    )


def _get_workspace_path(job: SandboxJob) -> Path:
    value = job.file_paths.get("workspace_path")
    if not value:
        raise ValueError("file_paths.workspace_path is required")

    workspace_path = Path(value).resolve()
    allowed_root = WORKSPACE_BASE_DIR.resolve()

    if not str(workspace_path).startswith(str(allowed_root)):
        raise ValueError("workspace path must be under RUNNER_WORKSPACE_BASE_DIR")

    return workspace_path


def _get_host_workspace_path(job: SandboxJob) -> Path:
    value = job.file_paths.get("host_workspace_path")
    if not value:
        raise ValueError("file_paths.host_workspace_path is required")

    workspace_path = Path(value).resolve()
    allowed_root = HOST_WORKSPACE_BASE_DIR.resolve()

    if not str(workspace_path).startswith(str(allowed_root)):
        raise ValueError("host workspace path must be under HOST_SUBMISSIONS_BASE_DIR")

    return workspace_path


def _container_command(language: str) -> list[str]:
    if language == "python":
        return ["python", "main.py"]
    if language == "cpp":
        return [
            "bash",
            "-lc",
            "g++ -std=c++20 -O2 -o /sandbox/app /workspace/main.cpp && chmod 755 /sandbox/app && /sandbox/app",
        ]
    raise ValueError(f"Unsupported language: {language}")


def _image_for_language(language: str) -> str:
    if language == "python":
        return PYTHON_IMAGE
    if language == "cpp":
        return CPP_IMAGE
    raise ValueError(f"Unsupported language: {language}")


def _security_opts() -> list[str]:
    options = ["no-new-privileges:true"]
    if APPARMOR_PROFILE:
        options.append(f"apparmor={APPARMOR_PROFILE}")
    if SECCOMP_PROFILE:
        options.append(f"seccomp={Path(SECCOMP_PROFILE).read_text()}")
    return options


def _run_in_sandbox(job: SandboxJob) -> SandboxExecutionResult:
    _get_workspace_path(job)
    workspace = _get_host_workspace_path(job)

    image = _image_for_language(job.language)
    command = _container_command(job.language)

    print(f"[runner] submission={job.submission_id}")
    print(f"[runner] host workspace={workspace}")
    print(f"[runner] language={job.language}")
    print(f"[runner] command={command}")

    started_at = time.monotonic()
    container = docker_client.containers.run(
        image=image,
        command=command,
        detach=True,
        network_disabled=True,
        read_only=True,
        user="sandbox",
        mem_limit=MEMORY_LIMIT,
        nano_cpus=int(CPU_LIMIT * 1_000_000_000),
        pids_limit=PIDS_LIMIT,
        cap_drop=["ALL"],
        security_opt=_security_opts(),
        tmpfs={
            "/tmp": f"rw,nosuid,nodev,size={TMPFS_SIZE}",
            "/sandbox": f"rw,nosuid,nodev,size={TMPFS_SIZE}",
        },
        volumes={
            str(workspace): {"bind": "/workspace", "mode": "ro"},
        },
        working_dir="/workspace",
    )

    timed_out = False
    try:
        wait_result = container.wait(timeout=TIMEOUT_SECONDS)
        exit_code = int(wait_result.get("StatusCode", 1))
    except Exception:
        timed_out = True
        container.kill()
        exit_code = 124

    stdout_raw = docker_client.api.logs(container.id, stdout=True, stderr=False)
    stderr_raw = docker_client.api.logs(container.id, stdout=False, stderr=True)
    duration_ms = int((time.monotonic() - started_at) * 1000)

    stdout_text = (stdout_raw or b"").decode("utf-8", errors="replace")
    stderr_text = (stderr_raw or b"").decode("utf-8", errors="replace")

    try:
        container.remove(force=True)
    except Exception as exc:
        print(f"[runner] warning: failed to remove container: {exc}")

    if len(stdout_text) > 50000:
        print(f"[runner] warning: stdout truncated at 50000 chars for submission={job.submission_id}")

    return SandboxExecutionResult(
        submission_id=job.submission_id,
        exit_code=exit_code,
        stdout=stdout_text[:50000],
        stderr=stderr_text[:50000],
        duration_ms=duration_ms,
        timed_out=timed_out,
        completed_at=datetime.now(timezone.utc),
    )


def _pick_next_submission(session):
    statement = text(
        """
        SELECT
            s.submission_id,
            s.assignment_id,
            s.student_id,
            s.file_paths,
            a.code_language,
            rt.line_items,
            rt.total_points
        FROM submission s
        JOIN assignment a
            ON a.assignment_id = s.assignment_id
        JOIN assignment_rubric ar
            ON ar.rubric_version_id = a.rubric_version_id
        JOIN rubric_template rt
            ON rt.template_id = ar.template_id
        LEFT JOIN grading_result g
            ON g.submission_id = s.submission_id
        WHERE g.submission_id IS NULL
        ORDER BY s.submitted_at ASC
        LIMIT 1
        """
    )
    return session.execute(statement).mappings().first()


def _store_result(session, row, result: SandboxExecutionResult):
    parsed_rubric = _parse_rubric_line_items(row.line_items)
    total_points = _safe_float(row.total_points, 100)

    print(f"[runner] raw rubric line_items type={type(row.line_items).__name__}")
    print(f"[runner] raw rubric line_items={row.line_items}")
    print(f"[runner] parsed rubric={parsed_rubric}")

    if not parsed_rubric:
        parsed_rubric = [{"criterion": "Correctness", "max": total_points}]

    passed = result.exit_code == 0 and not result.timed_out

    rubric_breakdown = []
    earned_total = 0.0

    for item in parsed_rubric:
        max_points = _safe_float(item.get("max"), 0)
        earned = max_points if passed else 0.0
        earned_total += earned

        rubric_breakdown.append(
            {
                "criterion": item.get("criterion", "Unnamed Criterion"),
                "earned": earned,
                "max": max_points,
                "comment": "Program executed successfully." if passed else "Program failed to execute.",
            }
        )

    # If rubric items sum to 0 because malformed points were stored,
    # fall back to total_points so grading_result is still usable.
    if earned_total == 0 and parsed_rubric:
        if len(parsed_rubric) == 1:
            rubric_breakdown[0]["max"] = total_points
            rubric_breakdown[0]["earned"] = total_points if passed else 0.0
            earned_total = total_points if passed else 0.0

    score = round(earned_total, 2)

    test_results = [
        {
            "name": "Program execution",
            "passed": result.exit_code == 0,
            "input": "",
            "expected": "Program runs without execution errors",
            "got": "Exit code 0" if result.exit_code == 0 else f"Exit code {result.exit_code}",
        },
        {
            "name": "Timeout check",
            "passed": not result.timed_out,
            "input": "",
            "expected": "No timeout",
            "got": "No timeout" if not result.timed_out else "Timed out",
        },
    ]

    ai_feedback = (
        "The submission executed successfully. The recommended score is based on the assignment rubric from the database."
        if passed
        else "The submission did not execute successfully. Review stderr and execution details before final grading."
    )

    ai_confidence = 0.78 if passed else 0.45

    insert_grading = text(
        """
        INSERT INTO grading_result (
            result_id,
            submission_id,
            total_points_earned,
            rubric_scores,
            faculty_reviewed
        )
        VALUES (
            md5(random()::text || clock_timestamp()::text),
            :submission_id,
            :total_points_earned,
            CAST(:rubric_scores AS jsonb),
            false
        )
        ON CONFLICT (submission_id) DO NOTHING
        """
    )

    insert_log = text(
        """
        INSERT INTO system_log (
            log_id,
            submission_id,
            id_users,
            test_case_id,
            log_type,
            details,
            timestamp
        )
        VALUES (
            md5(random()::text || clock_timestamp()::text),
            :submission_id,
            NULL,
            NULL,
            :log_type,
            CAST(:details AS jsonb),
            NOW()
        )
        """
    )

    rubric_scores = {
        "sandbox": {
            "exit_code": result.exit_code,
            "timed_out": result.timed_out,
            "duration_ms": result.duration_ms,
        },
        "ai_feedback": ai_feedback,
        "ai_confidence": ai_confidence,
        "test_results": test_results,
        "rubric_breakdown": rubric_breakdown,
        "ai_recommended_score": score,
        "accepted_ai_grade": False,
        "instructor_comments": "",
    }

    details = {
        "stdout": result.stdout,
        "stderr": result.stderr,
        "exit_code": result.exit_code,
        "timed_out": result.timed_out,
        "duration_ms": result.duration_ms,
        "parsed_rubric": parsed_rubric,
    }

    session.execute(
        insert_grading,
        {
            "submission_id": result.submission_id,
            "total_points_earned": score,
            "rubric_scores": json.dumps(rubric_scores),
        },
    )

    session.execute(
        insert_log,
        {
            "submission_id": result.submission_id,
            "log_type": "sandbox_execution",
            "details": json.dumps(details),
        },
    )

    session.commit()


def run_loop():
    WORKSPACE_BASE_DIR.mkdir(parents=True, exist_ok=True)

    while True:
        with SessionLocal() as session:
            row = _pick_next_submission(session)
            if not row:
                time.sleep(POLL_INTERVAL_SECONDS)
                continue

            try:
                job = _build_job(row)
                result = _run_in_sandbox(job)
                _store_result(session, row, result)
                print(f"[runner] processed submission={job.submission_id} exit={result.exit_code}")
            except Exception as exc:
                session.rollback()
                print(f"[runner] failed submission={row.submission_id}: {exc}")

        time.sleep(1)


if __name__ == "__main__":
    run_loop()