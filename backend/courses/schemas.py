from pydantic import BaseModel
from typing import Optional


class CourseBase(BaseModel):
    course_code: str
    semester: str
    faculty_id: str
    course_name: str
    course_description: Optional[str] = None


class CourseCreate(CourseBase):
    pass


class Course(CourseBase):
    id: str

    class Config:
        from_attributes = True
