from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.courses import schemas, crud
from backend.database.session import get_db
from backend.users.crud import get_user
from backend.auth.tokens import get_current_user

router = APIRouter(tags=["courses"], prefix="/courses")


@router.post("/", response_model=schemas.Course, status_code=status.HTTP_201_CREATED)
def create_course(payload: schemas.CourseCreate, db: Session = Depends(get_db), _: dict = Depends(get_current_user)):
    faculty = get_user(db, payload.faculty_id)
    if not faculty:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Faculty user not found")
    return crud.create_course(
        db,
        course_code=payload.course_code,
        semester=payload.semester,
        faculty_id=payload.faculty_id,
    )


@router.get("/", response_model=list[schemas.Course])
def list_courses(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), _: dict = Depends(get_current_user)):
    return crud.list_courses(db, skip=skip, limit=limit)


@router.get("/my-courses", response_model=list[schemas.Course])
def list_my_courses(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    faculty_id = current_user.get("sub")
    return crud.list_courses_for_faculty(db, faculty_id)


@router.get("/{course_id}", response_model=schemas.Course)
def get_course(course_id: str, db: Session = Depends(get_db), _: dict = Depends(get_current_user)):
    course = crud.get_course(db, course_id)
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    return course