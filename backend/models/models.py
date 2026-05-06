from __future__ import annotations
import uuid

from sqlalchemy import (
    Column,
    String,
    Integer,
    Boolean,
    Date,
    Time,
    ForeignKey,
    ARRAY,
    Numeric,
    TIMESTAMP,
    func,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship

from backend.database.session import Base


# helper UUID default
def gen_uuid() -> str:
    return str(uuid.uuid4())


class UsersAccount(Base):
    __tablename__ = "users_account"

    id: str = Column("id_users", String, primary_key=True, default=gen_uuid)
    position: list[str] = Column("position_users", ARRAY(String), nullable=False, default=["student"])
    email: str = Column("email_users", String, nullable=False, unique=True)
    hashed_password: str = Column("encryptedpassword_users", String, nullable=False)
    ferpa_consent: bool = Column("ferpa_consent", Boolean, nullable=False, default=False)

    # relationships
    enrollments = relationship("CourseEnrollment", back_populates="student")
    enrolled_courses = relationship(
        "Course",
        secondary="course_enrollment",
        back_populates="students",
        viewonly=True,
    )
    faculty_courses = relationship(
        "CourseFaculty",
        back_populates="faculty",
        cascade="all, delete-orphan",
    )
    submissions = relationship("Submission", back_populates="student", lazy="joined")
    flags_resolved = relationship("Flag", back_populates="resolved_by_user", lazy="joined")
    feedbacks = relationship("Feedback", back_populates="author", lazy="joined")
    notifications = relationship("Notification", back_populates="user", lazy="joined")
    logs = relationship("SystemLog", back_populates="user", lazy="joined")
    audit_histories = relationship("AuditHistory", back_populates="actor", lazy="joined")


class Course(Base):
    __tablename__ = "course"

    id: str = Column("course_id", String, primary_key=True, default=gen_uuid)
    course_code: str = Column("course_code", String, nullable=False)
    semester: str = Column("semester", String, nullable=False)
    course_name = Column(Text, nullable=False)
    course_description = Column(Text, nullable=True)

    assignments = relationship("Assignment", back_populates="course")
    enrollments = relationship("CourseEnrollment", back_populates="course")
    students = relationship(
        "UsersAccount",
        secondary="course_enrollment",
        back_populates="enrolled_courses",
        viewonly=True,
    )

    faculty_links = relationship(
        "CourseFaculty",
        back_populates="course",
        cascade="all, delete-orphan",
    )

class CourseFaculty(Base):
    __tablename__ = "course_faculty"

    course_id = Column(String, ForeignKey("course.course_id"), primary_key=True)
    faculty_id = Column(String, ForeignKey("users_account.id_users"), primary_key=True)

    course = relationship("Course", back_populates="faculty_links")
    faculty = relationship("UsersAccount", back_populates="faculty_courses")    


class CourseEnrollment(Base):
    __tablename__ = "course_enrollment"

    id: int = Column("enrollment_id", Integer, primary_key=True, index=True)
    course_id: str = Column(
        "course_id",
        String,
        ForeignKey("course.course_id", ondelete="CASCADE"),
        nullable=False,
    )
    student_id: str = Column(
        "student_id",
        String,
        ForeignKey("users_account.id_users", ondelete="CASCADE"),
        nullable=False,
    )
    enrolled_at = Column(
        "enrolled_at",
        TIMESTAMP(timezone=False),
        nullable=False,
        server_default=func.now(),
    )

    course = relationship("Course", back_populates="enrollments")
    student = relationship("UsersAccount", back_populates="enrollments")


class RubricTemplate(Base):
    __tablename__ = "rubric_template"

    id: str = Column("template_id", String, primary_key=True, default=gen_uuid)
    version: int = Column("version", Integer, nullable=False)
    line_items: dict = Column("line_items", JSONB, nullable=False)
    total_points: int = Column("total_points", Integer, nullable=False)

    assignment_rubrics = relationship("AssignmentRubric", back_populates="template")


class AssignmentRubric(Base):
    __tablename__ = "assignment_rubric"

    id: str = Column("rubric_version_id", String, primary_key=True, default=gen_uuid)
    template_id: str = Column("template_id", String, ForeignKey("rubric_template.template_id"), nullable=False)
    created_at = Column("created_at", TIMESTAMP(timezone=True), nullable=False, server_default=func.now())

    template = relationship("RubricTemplate", back_populates="assignment_rubrics")
    assignments = relationship("Assignment", back_populates="rubric")


class Assignment(Base):
    __tablename__ = "assignment"

    id: str = Column("assignment_id", String, primary_key=True, default=gen_uuid)
    course_id: str = Column("course_id", String, ForeignKey("course.course_id"), nullable=False)
    rubric_version_id: str = Column("rubric_version_id", String, ForeignKey("assignment_rubric.rubric_version_id"), nullable=False)
    code_language: str = Column("code_language", String, nullable=False)
    due_date: Date = Column("due_date", Date, nullable=False)
    due_time = Column("due_time", Time, nullable=False)
    assignment_name = Column(Text, nullable=False)
    assignment_description = Column(Text, nullable=True)
    max_files = Column(Integer, nullable=False, default=1)
    max_score = Column(Integer, nullable=True)


    course = relationship("Course", back_populates="assignments")
    rubric = relationship("AssignmentRubric", back_populates="assignments")
    test_cases = relationship("TestCase", back_populates="assignment")
    submissions = relationship("Submission", back_populates="assignment")
    assignment_files = relationship("AssignmentFile", back_populates="assignment", cascade="all, delete-orphan")

class AssignmentFile(Base):
    __tablename__ = "assignment_file"

    assignment_file_id = Column(Text, primary_key=True)
    assignment_id = Column(Text, ForeignKey("assignment.assignment_id", ondelete="CASCADE"), nullable=False)
    file_name = Column(Text, nullable=False)
    file_path = Column(Text, nullable=False)
    uploaded_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now())

    assignment = relationship("Assignment", back_populates="assignment_files")


class TestCase(Base):
    __tablename__ = "test_case"

    id: str = Column("test_case_id", String, primary_key=True, default=gen_uuid)
    assignment_id: str = Column("assignment_id", String, ForeignKey("assignment.assignment_id"), nullable=False)
    input_data: str = Column("input_data", String, nullable=False)
    expected_output: str = Column("expected_output", String, nullable=False)
    timeout_seconds: int = Column("timeout_seconds", Integer, nullable=False, default=5)

    assignment = relationship("Assignment", back_populates="test_cases")
    flags = relationship("Flag", back_populates="test_case")
    logs = relationship("SystemLog", back_populates="test_case")


class Submission(Base):
    __tablename__ = "submission"

    id: str = Column("submission_id", String, primary_key=True, default=gen_uuid)
    assignment_id: str = Column("assignment_id", String, ForeignKey("assignment.assignment_id"), nullable=False)
    student_id: str = Column("student_id", String, ForeignKey("users_account.id_users"), nullable=False)
    submitted_at = Column("submitted_at", TIMESTAMP(timezone=True), nullable=False, server_default=func.now())
    file_paths: dict = Column("file_paths", JSONB, nullable=False)

    assignment = relationship("Assignment", back_populates="submissions")
    student = relationship("UsersAccount", back_populates="submissions")
    grading_result = relationship("GradingResult", back_populates="submission", uselist=False)
    flags = relationship("Flag", back_populates="submission")
    feedbacks = relationship("Feedback", back_populates="submission")
    logs = relationship("SystemLog", back_populates="submission")


class GradingResult(Base):
    __tablename__ = "grading_result"

    id: str = Column("result_id", String, primary_key=True, default=gen_uuid)
    submission_id: str = Column("submission_id", String, ForeignKey("submission.submission_id"), nullable=False, unique=True)
    total_points_earned: float = Column("total_points_earned", Numeric(10, 2), nullable=False)
    rubric_scores: dict = Column("rubric_scores", JSONB, nullable=False)
    faculty_reviewed: bool = Column("faculty_reviewed", Boolean, nullable=False, default=False)

    submission = relationship("Submission", back_populates="grading_result")


class Flag(Base):
    __tablename__ = "flag"

    id: str = Column("flag_id", String, primary_key=True, default=gen_uuid)
    submission_id: str = Column("submission_id", String, ForeignKey("submission.submission_id"), nullable=False)
    test_case_id: str | None = Column("test_case_id", String, ForeignKey("test_case.test_case_id"), nullable=True)
    resolved_by: str | None = Column("resolved_by", String, ForeignKey("users_account.id_users"), nullable=True)
    source_type: str = Column("source_type", String, nullable=False)
    issue_type: str = Column("issue_type", String, nullable=False)
    description: str = Column("description", String, nullable=False)
    severity: str = Column("severity", String, nullable=False)
    status: str = Column("status", String, nullable=False)
    created_at = Column("created_at", TIMESTAMP(timezone=True), nullable=False, server_default=func.now())
    resolved_at = Column("resolved_at", TIMESTAMP(timezone=True), nullable=True)
    response_text: str | None = Column("response_text", String, nullable=True)

    submission = relationship("Submission", back_populates="flags")
    test_case = relationship("TestCase", back_populates="flags")
    resolved_by_user = relationship("UsersAccount", back_populates="flags_resolved")
    notifications = relationship("Notification", back_populates="flag")


class Feedback(Base):
    __tablename__ = "feedback"

    id: str = Column("feedback_id", String, primary_key=True, default=gen_uuid)
    submission_id: str = Column("submission_id", String, ForeignKey("submission.submission_id"), nullable=False)
    author_id: str = Column("author_id", String, ForeignKey("users_account.id_users"), nullable=False)
    source_type: str = Column("source_type", String, nullable=False)
    rubric_item_id: str | None = Column("rubric_item_id", String, nullable=True)
    message_text: str = Column("message_text", String, nullable=False)
    severity: str = Column("severity", String, nullable=False)
    created_at = Column("created_at", TIMESTAMP(timezone=True), nullable=False, server_default=func.now())

    submission = relationship("Submission", back_populates="feedbacks")
    author = relationship("UsersAccount", back_populates="feedbacks")


class Notification(Base):
    __tablename__ = "notification"

    id: str = Column("notification_id", String, primary_key=True, default=gen_uuid)
    user_id: str = Column("id_users", String, ForeignKey("users_account.id_users"), nullable=False)
    flag_id: str | None = Column("flag_id", String, ForeignKey("flag.flag_id"), nullable=True)
    message: str = Column("message", String, nullable=False)
    read: bool = Column("read", Boolean, nullable=False, default=False)
    created_at = Column("created_at", TIMESTAMP(timezone=True), nullable=False, server_default=func.now())

    user = relationship("UsersAccount", back_populates="notifications")
    flag = relationship("Flag", back_populates="notifications")


class SystemLog(Base):
    __tablename__ = "system_log"

    id: str = Column("log_id", String, primary_key=True, default=gen_uuid)
    submission_id: str | None = Column("submission_id", String, ForeignKey("submission.submission_id"), nullable=True)
    user_id: str | None = Column("id_users", String, ForeignKey("users_account.id_users"), nullable=True)
    test_case_id: str | None = Column("test_case_id", String, ForeignKey("test_case.test_case_id"), nullable=True)
    log_type: str = Column("log_type", String, nullable=False)
    details: dict = Column("details", JSONB, nullable=False)
    timestamp = Column("timestamp", TIMESTAMP(timezone=True), nullable=False, server_default=func.now())

    submission = relationship("Submission", back_populates="logs")
    user = relationship("UsersAccount", back_populates="logs")
    test_case = relationship("TestCase", back_populates="logs")


class AuditHistory(Base):
    __tablename__ = "audit_history"

    id: str = Column("history_id", String, primary_key=True, default=gen_uuid)
    actor_id: str = Column("actor_id", String, ForeignKey("users_account.id_users"), nullable=False)
    entity_type: str = Column("entity_type", String, nullable=False)
    entity_id: str = Column("entity_id", String, nullable=False)
    state_snapshot: dict = Column("state_snapshot", JSONB, nullable=False)
    timestamp = Column("timestamp", TIMESTAMP(timezone=True), nullable=False, server_default=func.now())

    actor = relationship("UsersAccount", back_populates="audit_histories")