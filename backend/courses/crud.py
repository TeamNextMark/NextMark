from sqlalchemy.orm import Session
import uuid

from backend.models import Course, CourseFaculty, CourseEnrollment


def get_course(db: Session, course_id: str) -> Course | None:
    return db.query(Course).get(course_id)


def list_courses(db: Session, *, skip: int = 0, limit: int = 100):
    return db.query(Course).offset(skip).limit(limit).all()


def list_courses_for_faculty(db: Session, faculty_id: str):
    return (
        db.query(Course)
        .join(CourseFaculty, CourseFaculty.course_id == Course.id)
        .filter(CourseFaculty.faculty_id == faculty_id)
        .order_by(Course.semester, Course.course_code)
        .all()
    )


def list_courses_for_student(db: Session, student_id: str):
    return (
        db.query(Course)
        .join(CourseEnrollment, CourseEnrollment.course_id == Course.id)
        .filter(CourseEnrollment.student_id == student_id)
        .order_by(Course.semester, Course.course_code)
        .all()
    )


def create_course(db: Session, *, course_code: str, semester: str, faculty_id: str, course_name: str, course_description: str | None = None,) -> Course:
    course = Course(
        id=str(uuid.uuid4()),
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
    
    return course