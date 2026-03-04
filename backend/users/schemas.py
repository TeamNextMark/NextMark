from pydantic import BaseModel, EmailStr
from typing import List


class UserCreate(BaseModel):
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class AuthUserResponse(BaseModel):
    id: str
    email: EmailStr
    roles: List[str]


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: AuthUserResponse


class TokenData(BaseModel):
    sub: str | None = None


class User(BaseModel):
    id: str
    email: EmailStr
    position: str
    ferpa_consent: bool

    class Config:
        orm_mode = True
