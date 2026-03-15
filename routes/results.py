from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import Column, Integer, String, DateTime, text
from pydantic import BaseModel
from datetime import datetime

from db import get_db, Base, engine

router = APIRouter(tags=["ai"])


# results 테이블 자동 생성용 모델
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


# 테이블 없으면 생성 (users, generations, results 모두)
Base.metadata.create_all(bind=engine)


class ResultIn(BaseModel):
    user_email: str
    product_desc: str
    target: str
    tone: str
    result_text: str


class ResultOut(BaseModel):
    id: int


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
