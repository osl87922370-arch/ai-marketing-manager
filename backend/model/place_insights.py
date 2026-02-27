from __future__ import annotations

from datetime import datetime, date
from typing import Optional, List, Dict, Any

from sqlalchemy import (
    String, Integer, Date, DateTime, ForeignKey, Text, JSON, Index
)
from sqlalchemy.orm import relationship, Mapped, mapped_column

from db import Base


class ReviewDataset(Base):
    __tablename__ = "review_datasets"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True, index=True)

    dataset_name: Mapped[str] = mapped_column(String(200), nullable=False)
    source_type: Mapped[str] = mapped_column(String(50), nullable=False, default="naver_place_reviews_excel")

    place_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    place_category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    place_area: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    default_year: Mapped[int] = mapped_column(Integer, nullable=False)

    extracted_blocks: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    extracted_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    rows: Mapped[List["ReviewRow"]] = relationship(
        "ReviewRow",
        back_populates="dataset",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class ReviewRow(Base):
    __tablename__ = "review_rows"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    dataset_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("review_datasets.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    nickname: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    review_text: Mapped[str] = mapped_column(Text, nullable=False)

    review_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    visit_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    meta: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=False, default=dict)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    dataset: Mapped["ReviewDataset"] = relationship("ReviewDataset", back_populates="rows")


Index("ix_review_rows_dataset_date", ReviewRow.dataset_id, ReviewRow.review_date)