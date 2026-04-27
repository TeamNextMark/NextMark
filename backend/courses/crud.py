from sqlalchemy.orm import Session, selectinload
import uuid

from backend.models import Course, CourseFaculty, CourseEnrollment


def _with_faculty_ids(course: Course) -> Course:
    course.faculty_ids = [link.faculty_id for link in (course.faculty_links or [])]
    return course


def get_course(db: Session, course_id: str) -> Course | None:
    course = (
        db.query(Course)
        .options(selectinload(Course.faculty_links))
        .filter(Course.id == course_id)
        .first()
    )
    return _with_faculty_ids(course) if course else None


def list_courses(db: Session, *, skip: int = 0, limit: int = 100):
    courses = (
        db.query(Course)
        .options(selectinload(Course.faculty_links))
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [_with_faculty_ids(course) for course in courses]


def list_courses_for_faculty(db: Session, faculty_id: str):
    courses = (
        db.query(Course)
        .options(selectinload(Course.faculty_links))
        .join(CourseFaculty, CourseFaculty.course_id == Course.id)
        .filter(CourseFaculty.faculty_id == faculty_id)
        .order_by(Course.semester, Course.course_code)
        .all()
    )
    return [_with_faculty_ids(course) for course in courses]


def list_courses_for_student(db: Session, student_id: str):
    courses = (
        db.query(Course)
        .options(selectinload(Course.faculty_links))
        .join(CourseEnrollment, CourseEnrollment.course_id == Course.id)
        .filter(CourseEnrollment.student_id == student_id)
        .order_by(Course.semester, Course.course_code)
        .all()
    )
    return [_with_faculty_ids(course) for course in courses]


def create_course(
    db: Session,
    *,
    course_code: str,
    semester: str,
    faculty_id: str,
    course_name: str,
    course_description: str | None = None,
    course_id: str | None = None,
) -> Course:
    clean_course_id = (course_id or "").strip() or str(uuid.uuid4())

    course = Course(
        id=clean_course_id,
        course_code=course_code,
        semester=semester,
        course_name=course_name,
        course_description=course_description,
    )

    db.add(course)
    db.flush()

    course_faculty = CourseFaculty(
        course_id=course.id,
        faculty_id=faculty_id,
    )

    db.add(course_faculty)
    db.commit()
    db.refresh(course)
    return _with_faculty_ids(course)
