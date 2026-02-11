from datetime import datetime
from typing import Optional
from pydantic import BaseModel


# ✅ 공통 베이스 (모든 Report가 상속)
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


# ✅ 생성용 (user_id 필수)
class ReportCreate(ReportBase):
    user_id: int


# ✅ 수정용 (전부 optional)
class ReportUpdate(BaseModel):
    store_name: Optional[str] = None
    reviews_text: Optional[str] = None
    ratings_csv: Optional[str] = None

    total_score: Optional[int] = None
    sentiment: Optional[int] = None
    shareability: Optional[int] = None
    growth: Optional[int] = None
    risk: Optional[int] = None

    summary: Optional[str] = None


# ✅ 응답용
class ReportOut(ReportBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True
