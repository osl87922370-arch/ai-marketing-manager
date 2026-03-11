from datetime import datetime
import uuid

from sqlalchemy import Column, String, DateTime, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship

from ..db import Base


class Generation(Base):
    __tablename__ = "generations"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)

    task = Column(String, nullable=True)
    input_json = Column(JSON, nullable=True)
    output_json = Column(JSON, nullable=True)
    headline = Column(String, nullable=True)
    status = Column(String, nullable=False, default="completed")

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    is_deleted = Column(Boolean, nullable=False, default=False)
    deleted_at = Column(DateTime, nullable=True)
    user = relationship("User", back_populates="generations")
