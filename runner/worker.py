from __future__ import annotations

import json
import os
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

    if not workspace_path.exists() or not workspace_path.is_dir():
        raise ValueError(f"host workspace path does not exist: {workspace_path}")

    return workspace_path


def _container_command(language: str) -> list[str]:
    if language == "python":
        return ["python", "main.py"]
    if language == "cpp":
        return [
            "bash",
            "-lc",
            "g++ -std=c++20 -O2 -o /sandbox/app /workspace/main.cpp && /sandbox/app",
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
            a.code_language
        FROM submission s
        JOIN assignment a ON a.assignment_id = s.assignment_id
        LEFT JOIN grading_result g ON g.submission_id = s.submission_id
        WHERE g.submission_id IS NULL
        ORDER BY s.submitted_at ASC
        LIMIT 1
        """
    )
    return session.execute(statement).mappings().first()


def _store_result(session, result: SandboxExecutionResult):
    score = 0.0 if result.exit_code != 0 else 100.0

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
        }
    }

    details = {
        "stdout": result.stdout,
        "stderr": result.stderr,
        "exit_code": result.exit_code,
        "timed_out": result.timed_out,
        "duration_ms": result.duration_ms,
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
                _store_result(session, result)
                print(f"[runner] processed submission={job.submission_id} exit={result.exit_code}")
            except Exception as exc:
                session.rollback()
                print(f"[runner] failed submission={row.submission_id}: {exc}")

        time.sleep(1)


if __name__ == "__main__":
    run_loop()