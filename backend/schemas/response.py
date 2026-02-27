from __future__ import annotations

from typing import Generic, Optional, TypeVar
from pydantic.generics import GenericModel

from .error import ErrorObject

T = TypeVar("T")


class ApiResponse(GenericModel, Generic[T]):
    ok: bool
    request_id: str
    api_version: str = "v1"
    data: Optional[T] = None
    error: Optional[ErrorObject] = None