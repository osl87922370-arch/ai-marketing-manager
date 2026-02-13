# backend/schemas.py
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr


# ---------- USER ----------
class UserCreate(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    is_active: bool
    created_at: datetime


# ---------- AUTH / TOKEN ----------
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    sub: Optional[str] = None


# ---------- REPORT ----------
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
    # user_id는 "클라에서 받지 않음" (JWT current_user로 서버에서 채움)
    pass


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


class ReportOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    store_name: Optional[str] = None
    reviews_text: str
    ratings_csv: Optional[str] = None

    total_score: int
    sentiment: int
    shareability: int
    growth: int
    risk: int

    summary: Optional[str] = None
    created_at: datetime
