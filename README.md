# NextMark - AI-Assisted Grading System

NextMark is an automated grading platform for programming assignments with AI code review, designed for Jetson Nano deployment.

## Architecture

- **backend/** - FastAPI application (REST API, authentication, CRUD)
- **runner/** - Sandbox worker service (executes student code in isolated containers)
- **frontend/** - React UI (student/instructor portals)
- **postgres/** - Database schema and migrations
- **ollama/** - LLM service (AI-powered code analysis)
- **nginx/** - Reverse proxy and static asset serving

## Quick Start

### Prerequisites

- Docker & Docker Compose
- PostgreSQL 16
- Python 3.11+

### Setup

1. Copy environment template:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and set your database credentials and secrets.

3. Start services:
   ```bash
   docker compose up -d
   ```

### Low-Memory Development Mode (optional)

If running on a machine with limited RAM (e.g., 16GB), see [LOW_MEMORY.md](LOW_MEMORY.md) for low-memory compose profiles.

## Development

### Backend

```bash
cd backend
pip install -r requirments.txt
uvicorn backend.main:app --reload
```

### Database Schema

Schema definition: [`nextmark db`](nextmark%20db)

Models are auto-generated from schema on backend startup. For production, use Alembic migrations.

### Sandbox Runner

The runner service polls ungraded submissions and executes them in isolated containers with strict security controls.

See [runner/README.md](runner/README.md) for details on sandbox behavior, security profiles, and digest pinning.

## Project Files

### Tracked (version control)

- Application code: `backend/`, `runner/`, `frontend/`
- Infrastructure: `compose.yaml`, `Dockerfile` files
- Documentation: `README.md`, `runner/README.md`
- Config templates: `.env.example`

### Local-only (ignored)

- Secrets/environment: `.env`, `.env.images`
- Machine-specific overrides: `compose.dev-lowmem.yaml`, `LOW_MEMORY.md`
- Local helper scripts: `scripts/up-lowmem.ps1`, `scripts/down-lowmem.ps1`, `scripts/resolve-image-digests.ps1`

See [.gitignore](.gitignore) for the full list.

## Security

- Student code runs in ephemeral containers with:
  - No network access
  - Read-only filesystem (tmpfs for compilation output only)
  - Non-root user
  - CPU/memory/PID limits
  - Optional seccomp and AppArmor profiles

- Container images can be pinned to digests for supply-chain security (see [runner/README.md](runner/README.md)).

## License

[Add license information]

## Contributors

- Billy Tilmon (Team NextMark)
