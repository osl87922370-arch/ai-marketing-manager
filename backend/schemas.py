from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class UserOut(BaseModel):
    id: int
    email: EmailStr
    created_at: datetime | None = None

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

from typing import Any, Optional, List
from datetime import datetime

class GenerationOut(BaseModel):
    id: str
    user_id: str
    task: Optional[str] = None
    input_json: Any
    headline: Optional[str] = None
    created_at: datetime

class HistoryResponse(BaseModel):
    items: List[GenerationOut]
    next_cursor: Optional[str] = None
