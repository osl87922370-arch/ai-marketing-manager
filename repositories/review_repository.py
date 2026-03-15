from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from models.place_insights import ReviewDataset, ReviewRow


def get_dataset(db: Session, dataset_id: str) -> ReviewDataset:
    dataset = db.query(ReviewDataset).filter(ReviewDataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail=f"Dataset {dataset_id} not found")
    return dataset


def get_reviews(db: Session, dataset_id: str, limit: int = 50) -> List[ReviewRow]:
    return (
        db.query(ReviewRow)
          .filter(ReviewRow.dataset_id == dataset_id)
          .order_by(ReviewRow.review_date.desc())
          .limit(limit)
          .all()
    )


def save_insights(db: Session, dataset_id: str, blocks: Dict[str, Any]) -> None:
    db.query(ReviewDataset).filter(ReviewDataset.id == dataset_id).update(
        {"extracted_blocks": blocks, "extracted_at": datetime.utcnow()}
    )
    db.commit()
