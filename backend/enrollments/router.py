from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import text

from backend.auth.tokens import get_current_user
from backend.database.session import get_db
from backend.models import Course, CourseEnrollment, UsersAccount

router = APIRouter(prefix="/enrollments", tags=["enrollments"])


class EnrollmentRequest(BaseModel):
    course_id: str
    student_ids: List[str]


def require_admin_or_faculty(current_user: dict = Depends(get_current_user)):
    roles = current_user.get("roles", []) or current_user.get("position", []) or []
    if not any(role in roles for role in ("admin", "faculty", "ta")):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin, faculty, or TA role required")
    return current_user


@router.get("/course/{course_id}/students")
def list_enrolled_students(
    course_id: str,
    db: Session = Depends(get_db),
    _: dict = Depends(require_admin_or_faculty),
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    rows = (
        db.query(UsersAccount)
        .join(CourseEnrollment, CourseEnrollment.student_id == UsersAccount.id)
        .filter(CourseEnrollment.course_id == course_id)
        .order_by(UsersAccount.email.asc())
        .all()
    )

    return [
        {
            "id": student.id,
            "email": student.email,
            "roles": student.position,
        }
        for student in rows
    ]


@router.post("/")
def enroll_students(
    data: EnrollmentRequest,
    db: Session = Depends(get_db),
    _: dict = Depends(require_admin_or_faculty),
):
    if not data.student_ids:
        raise HTTPException(status_code=400, detail="No students selected")

    course = db.query(Course).filter(Course.id == data.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

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


@router.delete("/course/{course_id}/students/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_student_from_course(
    course_id: str,
    student_id: str,
    db: Session = Depends(get_db),
    _: dict = Depends(require_admin_or_faculty),
):
    enrollment = (
        db.query(CourseEnrollment)
        .filter(
            CourseEnrollment.course_id == course_id,
            CourseEnrollment.student_id == student_id,
        )
        .first()
    )

    if not enrollment:
        raise HTTPException(status_code=404, detail="Student is not enrolled in this class")

    db.delete(enrollment)
    db.commit()
    return None
