import uuid
from datetime import datetime

from sqlalchemy import Column, String, Integer, DateTime, JSON, ForeignKey

from core.db import Base


class WorkflowRun(Base):
    __tablename__ = "workflow_runs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    dataset_id = Column(String(36), ForeignKey("review_datasets.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    channel = Column(String(20), nullable=False)           # sns / blog / ads
    status = Column(String(20), nullable=False)            # succeeded / failed
    result_json = Column(JSON, nullable=True)              # insights + variants 스냅샷
    latency_ms = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
