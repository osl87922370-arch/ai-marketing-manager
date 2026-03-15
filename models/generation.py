import uuid
from datetime import datetime

from sqlalchemy import Column, String, DateTime, ForeignKey, JSON, Integer

from core.db import Base


class Generation(Base):
    __tablename__ = "generations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)

    task = Column(String, nullable=True)
    input_json = Column(JSON, nullable=True)
    headline = Column(String, nullable=True)
    body = Column(String, nullable=True)
    cta = Column(String, nullable=True)
    hashtags = Column(JSON, nullable=True)
    model = Column(String, nullable=True)
    latency_ms = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
