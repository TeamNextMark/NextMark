from pydantic import BaseModel
from typing import Optional


class CourseBase(BaseModel):
    course_code: str
    semester: str
    course_name: str
    course_description: Optional[str] = None


class CourseCreate(CourseBase):
    faculty_id: str


class Course(CourseBase):
    id: str

    class Config:
        from_attributes = True
