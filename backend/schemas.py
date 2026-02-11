from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ReportCreate(BaseModel):
    store_name: Optional[str] = None
    reviews_text: str
    ratings_csv: Optional[str] = None

    total_score: int = Field(ge=0, le=100)
    sentiment: int = Field(ge=0, le=100)
    shareability: int = Field(ge=0, le=100)
    growth: int = Field(ge=0, le=100)
    risk: int = Field(ge=0, le=100)

    summary: Optional[str] = None

class ReportOut(BaseModel):
    id: int
    store_name: Optional[str]
    reviews_text: str
    ratings_csv: Optional[str]

    total_score: int
    sentiment: int
    shareability: int
    growth: int
    risk: int

    summary: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
