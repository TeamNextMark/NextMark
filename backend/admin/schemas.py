from pydantic import BaseModel, EmailStr
from typing import Optional


class AdminUserCreate(BaseModel):
    id: Optional[str] = None
    email: EmailStr
    password: str
    roles: list[str] = ["student"]
    ferpa_consent: bool = False


class AdminUserUpdate(BaseModel):
    id: Optional[str] = None
    email: Optional[EmailStr] = None
    roles: Optional[list[str]] = None
    ferpa_consent: Optional[bool] = None


class AdminUserOut(BaseModel):
    id: str
    email: str
    roles: list[str]
    ferpa_consent: bool

    class Config:
        from_attributes = True


class AdminCourseUpdate(BaseModel):
    course_code: Optional[str] = None
    course_name: Optional[str] = None
    course_description: Optional[str] = None
    semester: Optional[str] = None
    faculty_ids: Optional[list[str]] = None
