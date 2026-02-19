from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from datetime import datetime
from db import Base

class Generation(Base):
    __tablename__ = "generations"

    id = Column(UUID(as_uuid=True), primary_key=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)

    task = Column(String, nullable=True)
    input_json = Column(JSONB, nullable=True)
    headline = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
