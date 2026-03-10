from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.auth.hashing import hash_password, verify_password
from backend.auth.tokens import create_access_token
from backend.users.schemas import UserCreate, UserLogin, LoginResponse, AuthUserResponse

# These will be provided once the database and users modules are implemented
from backend.database.session import get_db  # dependency that yields a DB session
from backend.users.crud import get_user_by_email, create_user  # CRUD helpers

router = APIRouter(tags=["auth"])


@router.post("/signup", response_model=LoginResponse, status_code=status.HTTP_201_CREATED)
def signup(payload: UserCreate, db: Session = Depends(get_db)):
    if get_user_by_email(db, payload.email):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    hashed = hash_password(payload.password)
    user = create_user(db, email=payload.email, hashed_password=hashed, position=payload.position)
    token = create_access_token({"sub": str(user.id)})
    return LoginResponse(
        access_token=token,
        token_type="bearer",
        user=AuthUserResponse(
            id=str(user.id),
            email=user.email,
            roles=user.position,
        ),
    )


@router.post("/login", response_model=LoginResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = get_user_by_email(db, payload.email)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        password_ok = verify_password(payload.password, user.hashed_password)
    except ValueError:
        password_ok = False

    if not password_ok:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token({"sub": str(user.id)})

    return LoginResponse(
        access_token=token,
        token_type="bearer",
        user=AuthUserResponse(
            id=str(user.id),
            email=user.email,
            roles=user.position,
        ),
    )
