# backend/crud.py
from typing import Optional

from passlib.context import CryptContext
from sqlalchemy.orm import Session

from model.report import Report
from model.user import User
from schemas import ReportCreate, ReportUpdate, UserCreate

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ---------- PASSWORD ----------
def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


# ---------- USER ----------
def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()


def get_user(db: Session, user_id: int) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()


def create_user(db: Session, data: UserCreate) -> User:
    user = User(email=data.email, hashed_password=hash_password(data.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    user = get_user_by_email(db, email=email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


# ---------- REPORT (USER-SCOPED) ----------
def create_report_for_user(db: Session, user_id: int, data: ReportCreate) -> Report:
    obj = Report(user_id=user_id, **data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def list_reports_by_user(db: Session, user_id: int, limit: int = 50, offset: int = 0) -> list[Report]:
    return (
        db.query(Report)
        .filter(Report.user_id == user_id)
        .order_by(Report.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )


def get_report_by_user(db: Session, user_id: int, report_id: int) -> Optional[Report]:
    return (
        db.query(Report)
        .filter(Report.id == report_id, Report.user_id == user_id)
        .first()
    )


def update_report_by_user(db: Session, user_id: int, report_id: int, data: ReportUpdate) -> Optional[Report]:
    obj = get_report_by_user(db, user_id=user_id, report_id=report_id)
    if not obj:
        return None

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, key, value)

    db.commit()
    db.refresh(obj)
    return obj


def delete_report_by_user(db: Session, user_id: int, report_id: int) -> bool:
    obj = get_report_by_user(db, user_id=user_id, report_id=report_id)
    if not obj:
        return False
    db.delete(obj)
    db.commit()
    return True
