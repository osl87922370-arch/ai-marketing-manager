from enum import Enum
from typing import Any, Optional, List
from pydantic import BaseModel


class ErrorCode(str, Enum):
    VALIDATION_ERROR = "VALIDATION_ERROR"
    UNAUTHORIZED = "UNAUTHORIZED"
    FORBIDDEN = "FORBIDDEN"
    RATE_LIMITED = "RATE_LIMITED"
    UPSTREAM_ERROR = "UPSTREAM_ERROR"
    INTERNAL_ERROR = "INTERNAL_ERROR"


class FieldError(BaseModel):
    field: str
    reason: str


class ErrorDetails(BaseModel):
    field_errors: Optional[List[FieldError]] = None
    extra: Optional[dict[str, Any]] = None


class APIError(BaseModel):
    code: ErrorCode
    message: str
    details: Optional[ErrorDetails] = None

class ErrorResponse(BaseModel):
    code: ErrorCode
    message: str
    details: Optional[ErrorDetails] = None 