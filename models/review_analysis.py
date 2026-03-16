import uuid
from datetime import datetime

from sqlalchemy import Column, String, DateTime, ForeignKey, JSON, Integer

from core.db import Base


class ReviewAnalysis(Base):
    __tablename__ = "review_analyses"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)

    filename = Column(String, nullable=True)
    total = Column(Integer, nullable=True)
    ok = Column(Integer, nullable=True)
    fail = Column(Integer, nullable=True)

    positive_keywords = Column(JSON, nullable=True)
    negative_keywords = Column(JSON, nullable=True)
    target_suggestion = Column(String, nullable=True)
    tone_suggestion = Column(String, nullable=True)
    strength = Column(String, nullable=True)
    weakness = Column(String, nullable=True)
    copy_hint = Column(String, nullable=True)
    source_type = Column(String, nullable=True, default="excel")  # "excel" | "image"
    image_insights = Column(JSON, nullable=True)  # 이미지 분석 전용 필드

    created_at = Column(DateTime, default=datetime.utcnow)
