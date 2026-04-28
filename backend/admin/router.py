from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database.session import get_db
from backend.auth.tokens import get_current_user
from backend.auth.hashing import hash_password
from backend.models import UsersAccount, Course, CourseFaculty
from backend.admin import schemas

router = APIRouter(prefix="/admin", tags=["admin"])


def require_admin(current_user: dict = Depends(get_current_user)):
    roles = current_user.get("roles", []) or current_user.get("position", [])
    if "admin" not in roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin role required",
        )
    return current_user


@router.get("/users", response_model=list[schemas.AdminUserOut])
def list_users(
    db: Session = Depends(get_db),
    _: dict = Depends(require_admin),
):
    users = db.query(UsersAccount).order_by(UsersAccount.email.asc()).all()

    return [
        schemas.AdminUserOut(
            id=user.id,
            email=user.email,
            roles=user.position,
            ferpa_consent=user.ferpa_consent,
        )
        for user in users
    ]


@router.get("/users/{user_id}", response_model=schemas.AdminUserOut)
def get_user(
    user_id: str,
    db: Session = Depends(get_db),
    _: dict = Depends(require_admin),
):
    user = db.query(UsersAccount).filter(UsersAccount.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return schemas.AdminUserOut(
        id=user.id,
        email=user.email,
        roles=user.position,
        ferpa_consent=user.ferpa_consent,
    )


@router.post("/users", response_model=schemas.AdminUserOut, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: schemas.AdminUserCreate,
    db: Session = Depends(get_db),
    _: dict = Depends(require_admin),
):
    existing = db.query(UsersAccount).filter(UsersAccount.email == payload.email).first()

    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")

    clean_user_id = (payload.id or "").strip() or None
    if clean_user_id:
        existing_id = db.query(UsersAccount).filter(UsersAccount.id == clean_user_id).first()
        if existing_id:
            raise HTTPException(status_code=400, detail="T-number/User ID already exists")

    user = UsersAccount(
        id=clean_user_id,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        position=payload.roles,
        ferpa_consent=payload.ferpa_consent,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return schemas.AdminUserOut(
        id=user.id,
        email=user.email,
        roles=user.position,
        ferpa_consent=user.ferpa_consent,
    )


@router.put("/users/{user_id}", response_model=schemas.AdminUserOut)
def update_user(
    user_id: str,
    payload: schemas.AdminUserUpdate,
    db: Session = Depends(get_db),
    _: dict = Depends(require_admin),
):
    user = db.query(UsersAccount).filter(UsersAccount.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if payload.id is not None and payload.id.strip() and payload.id.strip() != user.id:
        new_id = payload.id.strip()
        existing_id = db.query(UsersAccount).filter(UsersAccount.id == new_id).first()
        if existing_id:
            raise HTTPException(status_code=400, detail="T-number/User ID already exists")
        user.id = new_id

    if payload.email is not None:
        duplicate_email = (
            db.query(UsersAccount)
            .filter(UsersAccount.email == payload.email, UsersAccount.id != user.id)
            .first()
        )
        if duplicate_email:
            raise HTTPException(status_code=400, detail="Email already exists")
        user.email = payload.email

    if payload.roles is not None:
        user.position = payload.roles

    if payload.ferpa_consent is not None:
        user.ferpa_consent = payload.ferpa_consent

    db.commit()
    db.refresh(user)

    return schemas.AdminUserOut(
        id=user.id,
        email=user.email,
        roles=user.position,
        ferpa_consent=user.ferpa_consent,
    )


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    _: dict = Depends(require_admin),
):
    user = db.query(UsersAccount).filter(UsersAccount.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)
    db.commit()

    return None


@router.put("/courses/{course_id}")
def update_course(
    course_id: str,
    payload: schemas.AdminCourseUpdate,
    db: Session = Depends(get_db),
    _: dict = Depends(require_admin),
):
    course = db.query(Course).filter(Course.id == course_id).first()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if payload.course_code is not None:
        course.course_code = payload.course_code

    if payload.course_name is not None:
        course.course_name = payload.course_name

    if payload.course_description is not None:
        course.course_description = payload.course_description

    if payload.semester is not None:
        course.semester = payload.semester

    if payload.faculty_ids is not None:
        clean_faculty_ids = [faculty_id.strip() for faculty_id in payload.faculty_ids if faculty_id and faculty_id.strip()]
        if not clean_faculty_ids:
            raise HTTPException(status_code=400, detail="At least one faculty ID is required")

        faculty_users = (
            db.query(UsersAccount)
            .filter(UsersAccount.id.in_(clean_faculty_ids))
            .all()
        )
        found_ids = {user.id for user in faculty_users}
        missing_ids = [faculty_id for faculty_id in clean_faculty_ids if faculty_id not in found_ids]
        if missing_ids:
            raise HTTPException(status_code=404, detail=f"Faculty user(s) not found: {', '.join(missing_ids)}")

        db.query(CourseFaculty).filter(CourseFaculty.course_id == course_id).delete()
        for faculty_id in clean_faculty_ids:
            db.add(CourseFaculty(course_id=course_id, faculty_id=faculty_id))

    db.commit()
    db.refresh(course)
    course.faculty_ids = [link.faculty_id for link in course.faculty_links]

    return course


@router.delete("/courses/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_course(
    course_id: str,
    db: Session = Depends(get_db),
    _: dict = Depends(require_admin),
):
    course = db.query(Course).filter(Course.id == course_id).first()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    db.query(CourseFaculty).filter(CourseFaculty.course_id == course_id).delete()

    db.delete(course)
    db.commit()

    return None