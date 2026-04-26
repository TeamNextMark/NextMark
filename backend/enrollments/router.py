from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import text

from backend.database.session import get_db

router = APIRouter(prefix="/enrollments", tags=["enrollments"])


class EnrollmentRequest(BaseModel):
    course_id: str
    student_ids: List[str]


@router.post("/")
def enroll_students(data: EnrollmentRequest, db: Session = Depends(get_db)):
    if not data.student_ids:
        raise HTTPException(status_code=400, detail="No students selected")

    for student_id in data.student_ids:
        db.execute(
            text("""
                INSERT INTO course_enrollment (course_id, student_id)
                VALUES (:course_id, :student_id)
                ON CONFLICT DO NOTHING
            """),
            {
                "course_id": data.course_id,
                "student_id": student_id,
            }
        )

    db.commit()

    return {
        "message": "Students enrolled successfully",
        "course_id": data.course_id,
        "student_count": len(data.student_ids),
    }