
from __future__ import annotations

from typing import Any, Dict, List, Optional
from datetime import datetime
from pydantic import BaseModel, Field


# -------------------------
# Request
# -------------------------

class GenerateParams(BaseModel):
    variant_count: int = Field(3, ge=1, le=20)


class GenerateRequest(BaseModel):
    task: str
    userEmail: Optional[str] = None
    input: Dict[str, Any]

    target: str
    channel: str
    goal: str
    product_name: str
    params: GenerateParams


# -------------------------
# Response
# -------------------------

class Variant(BaseModel):
    headline: str
    body: str
    cta: Optional[str] = None
    hashtags: Optional[List[str]] = None


class Usage(BaseModel):
    total_tokens: Optional[int] = None
    variant_count: int
    credit_used: int
    pricing_version: str = "credits_v1"
    breakdown: Optional[Dict[str, Any]] = None
    model: Optional[str] = None
    latency_ms: Optional[int] = None


class GenerationOutput(BaseModel):
    variants: List[Variant]


class Generation(BaseModel):
    id: str
    status: str
    created_at: datetime
    output: GenerationOutput
    usage: Usage


class GenerateResponse(BaseModel):
    ok: bool = True
    request_id: str = "req_test"
    api_version: str = "v1"
    generation: Generation
    error: Optional[Dict[str, Any]] = None