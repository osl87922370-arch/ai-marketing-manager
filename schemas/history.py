from __future__ import annotations

from datetime import datetime
from typing import Any, List, Optional

from pydantic import BaseModel


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
    user_email: Optional[str] = None
