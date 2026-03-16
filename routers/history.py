from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from core.db import get_db
from core.security import get_current_user
from repositories.generation_repository import (
    delete_generation,
    get_generation,
    get_history,
)
from schemas.history import GenerationOut, HistoryResponse

router = APIRouter()


@router.get("/history", response_model=HistoryResponse)
def list_history(
    limit: int = Query(20, ge=1, le=50),
    cursor: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    rows, next_cursor = get_history(db, str(current_user.id), limit, cursor)

    items = [
        GenerationOut(
            id=str(r.id),
            user_id=str(r.user_id),
            task=getattr(r, "task", None),
            input_json=r.input_json,
            headline=getattr(r, "headline", None),
            body=getattr(r, "body", None),
            cta=getattr(r, "cta", None),
            hashtags=getattr(r, "hashtags", None),
            created_at=r.created_at,
        )
        for r in rows
    ]

    return HistoryResponse(
        items=items,
        next_cursor=next_cursor,
        user_email=current_user.email,
    )


@router.get("/history/{generation_id}", response_model=GenerationOut)
def get_history_detail(
    generation_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    r = get_generation(db, generation_id, str(current_user.id))
    return GenerationOut(
        id=str(r.id),
        user_id=str(r.user_id),
        task=getattr(r, "task", None),
        input_json=r.input_json,
        headline=getattr(r, "headline", None),
        body=getattr(r, "body", None),
        cta=getattr(r, "cta", None),
        hashtags=getattr(r, "hashtags", None),
        created_at=r.created_at,
    )


@router.delete("/history/{generation_id}", status_code=204)
def delete_history(
    generation_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    delete_generation(db, generation_id, str(current_user.id))
