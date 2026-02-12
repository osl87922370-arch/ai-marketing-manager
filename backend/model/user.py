# backend/model/user.py
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from db import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    # 로그인 식별자
    email = Column(String(255), unique=True, index=True, nullable=False)

    # JWT 로그인용 (해시 비번)
    hashed_password = Column(String(255), nullable=False)

    # 운영 편의
    is_active = Column(Integer, default=1, nullable=False)  # 1/0
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # 관계
    reports = relationship(
        "Report",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
