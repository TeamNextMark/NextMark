import os
from fastapi import FastAPI
from backend.auth.router import router as auth_router
from backend.courses.router import router as courses_router
from backend.grading.router import router as grading_router
from backend.submissions.router import router as submissions_router
from backend.assignments.router import router as assignments_router

app = FastAPI()

app.include_router(auth_router, prefix="/auth")
app.include_router(courses_router)
app.include_router(grading_router)
app.include_router(submissions_router)
app.include_router(assignments_router)

@app.get("/healthz")
def healthz():
    return {
        "status": "ok",
        "database_url_configured": bool(os.getenv("DATABASE_URL")),
        "ollama_base_url": os.getenv("OLLAMA_BASE_URL", ""),
        "llm_model": os.getenv("LLM_MODEL", ""),
    }
