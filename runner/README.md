# NextMark Runner (Sandbox Worker)

This worker polls ungraded submissions from the database and executes student code in short-lived, locked-down containers.

## Current queue contract

The worker reads pending work from existing schema records:
- `submission`
- `assignment`
- `grading_result`

A submission is considered **queued** when it has no row in `grading_result`.

The expected `submission.encrypted_file_paths` JSON currently includes:

```json
{
  "workspace_path": "/var/lib/nextmark/submissions/<submission_id>"
}
```

## Sandbox behavior

- One container per submission
- No network access
- Read-only filesystem inside container
- Non-root user (`sandbox`)
- `cap_drop: ALL`
- `no-new-privileges`
- CPU / memory / pids / timeout limits
- Writable tmpfs mounts only for `/tmp` and `/sandbox` (size configurable)
- Optional AppArmor and seccomp profile injection from environment

## Build and run

Build sandbox images:

```bash
docker compose --profile sandbox-images build sandbox-python sandbox-cpp
```

Run platform services including runner:

```bash
docker compose up -d postgres backend runner ollama nginx
```

## Digest pinning workflow

1. Generate pinned image references (requires local Docker CLI):

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\resolve-image-digests.ps1
```

2. Start compose with pinned refs:

```bash
docker compose --env-file .env --env-file .env.images --profile sandbox-images up -d --build
```

Compose and Dockerfiles are wired to accept these variables:

- `POSTGRES_IMAGE`
- `NGINX_IMAGE`
- `OLLAMA_IMAGE`
- `BACKEND_BASE_IMAGE`
- `RUNNER_BASE_IMAGE`
- `SANDBOX_PYTHON_BASE_IMAGE`
- `SANDBOX_CPP_BASE_IMAGE`

## Notes

- Python submissions currently execute `main.py`.
- C++ submissions compile from read-only `/workspace/main.cpp` into `/sandbox/app` and execute from tmpfs.
- This is a first slice; test-case execution and LLM rubric analysis can be added as the next phase.

## Optional host hardening knobs

Set these environment variables for the `runner` service if available on your Docker host:

- `RUNNER_APPARMOR_PROFILE` (example: `nextmark-sandbox`)
- `RUNNER_SECCOMP_PROFILE` (absolute path on Docker host)
- `RUNNER_SANDBOX_TMPFS_SIZE` (default `64m`)

A baseline seccomp profile is included at `runner/security/seccomp-nextmark.json`.
Copy it to a host path available to your Docker daemon and set `RUNNER_SECCOMP_PROFILE` to that host path.
