from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from core.db import get_db
from models.result import Result
from schemas.result import ResultIn, ResultOut

router = APIRouter(tags=["ai"])


@router.post("/results", response_model=ResultOut)
def save_result(payload: ResultIn, db: Session = Depends(get_db)):
    row = Result(
        user_email=payload.user_email,
        product_desc=payload.product_desc,
        target=payload.target,
        tone=payload.tone,
        result_text=payload.result_text,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return ResultOut(id=row.id)
