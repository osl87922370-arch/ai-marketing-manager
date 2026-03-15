from __future__ import annotations

from typing import List, Literal

from pydantic import BaseModel, Field

from schemas.generate import Variant
from schemas.place_insights import PlaceInsightContext


class RunRequest(BaseModel):
    channel: Literal["sns", "blog", "ads"] = "sns"
    variant_count: int = Field(3, ge=1, le=10)


class RunResponse(BaseModel):
    run_id: str
    dataset_id: str
    channel: str
    insights: PlaceInsightContext
    variants: List[Variant]
    latency_ms: int
