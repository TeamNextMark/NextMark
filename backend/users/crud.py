from sqlalchemy.orm import Session
import uuid

from backend.models import UsersAccount


def get_user_by_email(db: Session, email: str) -> UsersAccount | None:
    return db.query(UsersAccount).filter(UsersAccount.email == email).first()


def get_user(db: Session, user_id: str) -> UsersAccount | None:
    return db.query(UsersAccount).get(user_id)


def create_user(db: Session, *, email: str, hashed_password: str, position: list[str] | None = None) -> UsersAccount:
    if position is None:
        position = ["student"]
    user = UsersAccount(
        id=str(uuid.uuid4()),
        email=email,
        hashed_password=hashed_password,
        position=position,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
