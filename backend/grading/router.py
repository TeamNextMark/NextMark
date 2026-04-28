import os
import re
import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from backend.auth.tokens import get_current_user

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://ollama:11434")
LLM_MODEL = os.getenv("LLM_MODEL", "qwen3:4b")

router = APIRouter(tags=["grading"], prefix="/grade")


class GradeRequest(BaseModel):
    code: str
    language: str
    rubric: str


class GradeResponse(BaseModel):
    score: str
    feedback: str


@router.post("/", response_model=GradeResponse)
async def grade_submission(
    payload: GradeRequest,
    current_user: dict = Depends(get_current_user),
):
    if not any(r in current_user.get("roles", []) for r in ("faculty", "ta")):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Faculty or TA role required")
    prompt = (
        f"/no_think\n\n"
        f"You are a code grading assistant. Grade the following {payload.language} code "
        f"based on the rubric provided.\n\n"
        f"Rubric:\n{payload.rubric}\n\n"
        f"Code:\n```{payload.language}\n{payload.code}\n```\n\n"
        f"Respond with exactly two lines:\n"
        f"SCORE: <numeric score out of 100>\n"
        f"FEEDBACK: <brief feedback>\n"
    )

    try:
        async with httpx.AsyncClient(timeout=300.0) as client:
            resp = await client.post(
                f"{OLLAMA_BASE_URL}/api/generate",
                json={"model": LLM_MODEL, "prompt": prompt, "stream": False},
            )
            resp.raise_for_status()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"LLM request failed: {type(exc).__name__}: {exc}",
        )

    text = resp.json().get("response", "")
    score_match = re.search(r"SCORE:\s*(.+)", text)
    feedback_match = re.search(r"FEEDBACK:\s*(.+)", text)

    return GradeResponse(
        score=score_match.group(1).strip() if score_match else "N/A",
        feedback=feedback_match.group(1).strip() if feedback_match else text.strip(),
    )
