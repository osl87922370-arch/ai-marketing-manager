# backend/model/report.py
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from db import Base


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)

    # ✅ FK (DB 레벨 연결)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)

    store_name = Column(String(120), nullable=True)
    reviews_text = Column(Text, nullable=False)
    ratings_csv = Column(String(200), nullable=True)

    total_score = Column(Integer, nullable=False)
    sentiment = Column(Integer, nullable=False)
    shareability = Column(Integer, nullable=False)
    growth = Column(Integer, nullable=False)
    risk = Column(Integer, nullable=False)

    summary = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # 관계
    user = relationship("User", back_populates="reports")
