# backend/schemas.py
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class ReportBase(BaseModel):
    store_name: Optional[str] = None
    reviews_text: str
    ratings_csv: Optional[str] = None

    total_score: int
    sentiment: int
    shareability: int
    growth: int
    risk: int

    summary: Optional[str] = None


class ReportCreate(ReportBase):
    # ✅ user_id를 여기서 없애도 됨 (권장)
    # user_id: int  # <-- 제거 추천
    pass


class ReportUpdate(BaseModel):
    # ✅ 부분 업데이트 허용(없으면 업데이트 안 함)
    store_name: Optional[str] = None
    reviews_text: Optional[str] = None
    ratings_csv: Optional[str] = None

    total_score: Optional[int] = None
    sentiment: Optional[int] = None
    shareability: Optional[int] = None
    growth: Optional[int] = None
    risk: Optional[int] = None

    summary: Optional[str] = None


class ReportOut(ReportBase):
    id: int
    user_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
