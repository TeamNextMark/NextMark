import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database.session import get_db
from backend.auth.tokens import get_current_user
from backend.models.models import (
    Assignment,
    AssignmentRubric,
    Course,
    Submission,
    GradingResult,
    RubricTemplate,
)
from backend.assignments import schemas

router = APIRouter(prefix="/assignments", tags=["assignments"])


@router.post("/", response_model=schemas.AssignmentBase, status_code=status.HTTP_201_CREATED)
def create_assignment(
    payload: schemas.AssignmentCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    roles = current_user.get("roles", []) or current_user.get("position", []) or []
    user_id = current_user.get("sub")

    if "faculty" not in roles and "admin" not in roles:
        raise HTTPException(status_code=403, detail="Only faculty or admin can create assignments")

    course = db.query(Course).filter(Course.id == payload.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if "admin" not in roles and course.faculty_id != user_id:
        raise HTTPException(status_code=403, detail="You can only create assignments for your own courses")

    rubric_items = [
        {
            "criterion": item.criterion.strip(),
            "max": int(item.max),
            "description": item.description.strip() if item.description else "",
        }
        for item in payload.rubric_items
    ]

    total_points = sum(item["max"] for item in rubric_items)

    try:
        template = RubricTemplate(
            id=str(uuid.uuid4()),
            version=1,
            line_items=rubric_items,
            total_points=total_points,
        )
        db.add(template)
        db.flush()

        assignment_rubric = AssignmentRubric(
            id=str(uuid.uuid4()),
            template_id=template.id,
        )
        db.add(assignment_rubric)
        db.flush()

        assignment = Assignment(
            id=str(uuid.uuid4()),
            course_id=payload.course_id,
            rubric_version_id=assignment_rubric.id,
            code_language=payload.code_language,
            due_date=payload.due_date,
            assignment_name=payload.assignment_name.strip(),
            assignment_description=(payload.assignment_description or "").strip() or None,
            max_files=payload.max_files,
            max_score=total_points,
        )
        db.add(assignment)
        db.commit()
        db.refresh(assignment)
        return assignment

    except Exception:
        db.rollback()
        raise


@router.get("/course/{course_id}", response_model=list[schemas.AssignmentListItem])
def list_assignments_for_course(
    course_id: str,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    assignments = (
        db.query(Assignment)
        .filter(Assignment.course_id == course_id)
        .order_by(Assignment.due_date.asc())
        .all()
    )
    return assignments


@router.get("/{assignment_id}", response_model=schemas.AssignmentDetail)
def get_assignment(
    assignment_id: str,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    assignment = (
        db.query(Assignment)
        .filter(Assignment.id == assignment_id)
        .first()
    )
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    rubric_items = []
    if assignment.rubric and assignment.rubric.template:
        raw_items = assignment.rubric.template.line_items
        if isinstance(raw_items, list):
            rubric_items = raw_items
        elif isinstance(raw_items, dict):
            rubric_items = raw_items.get("items", [raw_items])

    return schemas.AssignmentDetail(
        id=assignment.id,
        course_id=assignment.course_id,
        rubric_version_id=assignment.rubric_version_id,
        code_language=assignment.code_language,
        due_date=assignment.due_date.isoformat(),
        assignment_name=assignment.assignment_name,
        assignment_description=assignment.assignment_description,
        max_files=assignment.max_files,
        max_score=assignment.max_score,
        rubric_items=rubric_items,
    )


@router.get("/{assignment_id}/submissions", response_model=list[schemas.SubmissionListItem])
def list_assignment_submissions(
    assignment_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user.get("sub")
    roles = current_user.get("roles", []) or current_user.get("position", []) or []

    if "faculty" not in roles and "admin" not in roles and "ta" not in roles:
        raise HTTPException(status_code=403, detail="Not allowed")

    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    submissions = (
        db.query(Submission, GradingResult)
        .outerjoin(GradingResult, GradingResult.submission_id == Submission.id)
        .filter(Submission.assignment_id == assignment_id)
        .order_by(Submission.submitted_at.desc())
        .all()
    )

    result = []
    for submission, grading in submissions:
        result.append(
            schemas.SubmissionListItem(
                submission_id=submission.id,
                student_id=submission.student_id,
                submitted_at=submission.submitted_at.isoformat(),
                score=float(grading.total_points_earned) if grading else None,
                faculty_reviewed=grading.faculty_reviewed if grading else None,
            )
        )
    return result


@router.get("/{assignment_id}/my-submissions", response_model=list[schemas.SubmissionListItem])
def list_my_submissions_for_assignment(
    assignment_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    student_id = current_user.get("sub")

    submissions = (
        db.query(Submission, GradingResult)
        .outerjoin(GradingResult, GradingResult.submission_id == Submission.id)
        .filter(
            Submission.assignment_id == assignment_id,
            Submission.student_id == student_id,
        )
        .order_by(Submission.submitted_at.desc())
        .all()
    )

    result = []
    for submission, grading in submissions:
        result.append(
            schemas.SubmissionListItem(
                submission_id=submission.id,
                student_id=submission.student_id,
                submitted_at=submission.submitted_at.isoformat(),
                score=float(grading.total_points_earned) if grading else None,
                faculty_reviewed=grading.faculty_reviewed if grading else None,
            )
        )
    return result