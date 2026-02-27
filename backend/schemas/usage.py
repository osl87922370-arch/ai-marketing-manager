from typing import Optional, Dict, Any
from pydantic import BaseModel


class Usage(BaseModel):
    total_tokens: Optional[int] = None

    variant_count: int
    credit_used: int

    pricing_version: str = "credits_v1"
    breakdown: Optional[Dict[str, Any]] = None

    model: Optional[str] = None
    latency_ms: Optional[int] = None