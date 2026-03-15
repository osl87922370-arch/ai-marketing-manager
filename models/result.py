from datetime import datetime

from sqlalchemy import Column, Integer, String, DateTime

from core.db import Base


class Result(Base):
    __tablename__ = "results"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_email = Column(String, nullable=False)
    product_desc = Column(String, nullable=True)
    target = Column(String, nullable=True)
    tone = Column(String, nullable=True)
    result_text = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
