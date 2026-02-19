from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import Optional

from db import get_db
from auth import get_current_user
from model.generation import Generation
from schemas import HistoryResponse, GenerationOut
from utils.pagination import encode_cursor, decode_cursor

router = APIRouter()

@router.get("/ai/history", response_model=HistoryResponse)
def get_history(
    limit: int = Query(20, ge=1, le=50),
    cursor: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    # ✅ 사용자별 데이터 보호(서버 레벨)
    q = db.query(Generation).filter(Generation.user_id == current_user.id)

    # ✅ cursor pagination (keyset)
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
        last = rows[limit - 1]   # 이번 페이지의 마지막 아이템
        next_cursor = encode_cursor(last.created_at, str(last.id))
        rows = rows[:limit]

    items = [
        GenerationOut(
            id=str(r.id),
            user_id=str(r.user_id),
            task=getattr(r, "task", None),
            input_json=getattr(r, "input_json"),
            headline=getattr(r, "headline", None),
            created_at=r.created_at,
        )
        for r in rows
    ]

    return HistoryResponse(items=items, next_cursor=next_cursor)


@router.get("/ai/history/{generation_id}", response_model=GenerationOut)
def get_history_detail(
    generation_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    # ✅ 사용자별 데이터 보호(서버 레벨)
    r = (
        db.query(Generation)
          .filter(Generation.id == generation_id, Generation.user_id == current_user.id)
          .first()
    )
    if not r:
        raise HTTPException(status_code=404, detail="Not found")

    return GenerationOut(
        id=str(r.id),
        user_id=str(r.user_id),
        task=getattr(r, "task", None),
        input_json=getattr(r, "input_json"),
        headline=getattr(r, "headline", None),
        created_at=r.created_at,
    )
