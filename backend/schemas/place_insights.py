from pydantic import BaseModel, Field
from typing import Optional, List, Literal, Dict, Any
from datetime import date


class ReviewRowIn(BaseModel):
    nickname: Optional[str] = Field(default=None, description="리뷰 작성자 닉네임")
    review_text: str = Field(..., min_length=1, description="리뷰 본문")
    review_date_raw: str = Field(..., description="원본 작성일 문자열 (예: '2.11.화')")
    visit_count_raw: Optional[str] = Field(default=None, description="원본 방문 횟수 (예: '3번째 방문')")


class ReviewRowNormalized(BaseModel):
    nickname: Optional[str]
    review_text: str
    review_date: date
    visit_count: Optional[int] = Field(default=None, ge=1)
    meta: Dict[str, Any] = Field(default_factory=dict)


class ReviewDatasetCreate(BaseModel):
    dataset_name: str
    place_name: Optional[str] = None
    place_category: Optional[str] = None
    place_area: Optional[str] = None
    default_year: int
    source_type: Literal["naver_place_reviews_excel"] = "naver_place_reviews_excel"


class InsightBlock(BaseModel):
    type: Literal[
        "keywords",
        "feature",
        "benefit",
        "proof",
        "pain_point",
        "objection_handler",
    ]
    items: List[str] = Field(default_factory=list)
    score: Optional[float] = None
    meta: Dict[str, Any] = Field(default_factory=dict)


class InsightBlocks(BaseModel):
    dataset_id: str
    blocks: List[InsightBlock]
    stats: Dict[str, Any] = Field(default_factory=dict)


class PlaceInsightContext(BaseModel):
    dataset_id: str
    keywords: List[str] = []
    features: List[str] = []
    benefits: List[str] = []
    proofs: List[str] = []
    pain_points: List[str] = []
    objections: List[str] = []
    meta: Dict[str, Any] = Field(default_factory=dict)