import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, String

from core.db import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, index=True, nullable=False)
    plan = Column(String(10), default="basic", server_default="basic", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
