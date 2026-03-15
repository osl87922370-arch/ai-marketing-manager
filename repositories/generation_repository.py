from __future__ import annotations

from typing import Optional, Tuple
from datetime import datetime

from fastapi import HTTPException
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from models.generation import Generation
from utils.pagination import encode_cursor, decode_cursor


def save_generation(db: Session, gen: Generation) -> None:
    db.add(gen)
    db.commit()


def get_history(
    db: Session,
    user_id: str,
    limit: int = 20,
    cursor: Optional[str] = None,
) -> Tuple[list[Generation], Optional[str]]:
    q = db.query(Generation).filter(Generation.user_id == user_id)

    if cursor:
        c_created_at, c_id = decode_cursor(cursor)
        q = q.filter(
            or_(
                Generation.created_at < c_created_at,
                and_(Generation.created_at == c_created_at, Generation.id < c_id),
            )
        )

    rows = (
        q.order_by(Generation.created_at.desc(), Generation.id.desc())
         .limit(limit + 1)
         .all()
    )

    next_cursor = None
    if len(rows) > limit:
        last = rows[limit - 1]
        next_cursor = encode_cursor(last.created_at, str(last.id))
        rows = rows[:limit]

    return rows, next_cursor


def get_generation(db: Session, gen_id: str, user_id: str) -> Generation:
    row = (
        db.query(Generation)
          .filter(Generation.id == gen_id, Generation.user_id == user_id)
          .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Not found")
    return row


def delete_generation(db: Session, gen_id: str, user_id: str) -> None:
    row = (
        db.query(Generation)
          .filter(Generation.id == gen_id, Generation.user_id == user_id)
          .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(row)
    db.commit()
