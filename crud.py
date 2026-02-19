from __future__ import annotations

from typing import Optional

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from passlib.context import CryptContext

# ✅ bcrypt 제거: pbkdf2_sha256 사용 (72바이트 제한/백엔드 이슈 없음)
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

# ⚠️ User 모델 import 경로는 네 프로젝트에 맞게 조정
# - user.py가 backend 폴더에 있으면: from user import User
# - model/user.py에 있으면: from model.user import User
from model.user import User



def hash_password(password: str) -> str:
    if not isinstance(password, str):
        password = str(password)
    # 안전 가드(너무 긴 입력 방지)
    if len(password.encode("utf-8")) > 1024:
        raise HTTPException(status_code=400, detail="Password too long")
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not isinstance(plain_password, str):
        plain_password = str(plain_password)
    return pwd_context.verify(plain_password, hashed_password)


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()


def create_user(db: Session, data) -> User:
    """
    data: schemas.UserCreate (email, password)
    """
    email = data.email.strip().lower()
    password = data.password

    existing = get_user_by_email(db, email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_pw = hash_password(password)
    user = User(email=email, hashed_password=hashed_pw)

    try:
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Email already registered")


def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    user = get_user_by_email(db, email.strip().lower())
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user

