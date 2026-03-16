import logging
import uuid

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from core.config import DATABASE_URL
from core.db import Base, engine
from core.security import get_current_user
from schemas.error import ErrorCode, ErrorDetails, ErrorObject, FieldError
from schemas.response import ApiResponse

# 모든 ORM 모델을 import해야 create_all이 테이블을 인식함
import models.user  # noqa: F401
import models.generation  # noqa: F401
import models.result  # noqa: F401
import models.place_insights  # noqa: F401
import models.workflow_run  # noqa: F401
import models.review_analysis  # noqa: F401

from routers.generate import router as generate_router
from routers.history import router as history_router
from routers.results import router as results_router
from routers.place_insights import router as place_insights_router
from routers.reviews import router as reviews_router
from routers.dashboard import router as dashboard_router

# ======================
# 테이블 자동 생성
# ======================
Base.metadata.create_all(bind=engine)

# ======================
# App
# ======================
app = FastAPI()

logger = logging.getLogger(__name__)

# ======================
# CORS
# ======================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ======================
# Middleware
# ======================

def _get_request_id(request: Request) -> str:
    rid = request.headers.get("x-request-id")
    return rid if rid else f"req_{uuid.uuid4().hex[:12]}"


@app.middleware("http")
async def request_id_middleware(request: Request, call_next):
    rid = _get_request_id(request)
    request.state.request_id = rid
    response = await call_next(request)
    response.headers["x-request-id"] = rid
    return response


# ======================
# Exception Handlers
# ======================

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    request_id = _get_request_id(request)
    field_errors = [
        FieldError(field=".".join(map(str, err["loc"])), reason=err["msg"])
        for err in exc.errors()
    ]
    error = ErrorObject(
        code=ErrorCode.VALIDATION_ERROR,
        message="Request validation failed",
        details=ErrorDetails(field_errors=field_errors),
    )
    return JSONResponse(
        status_code=422,
        content=ApiResponse(
            ok=False,
            request_id=request_id,
            api_version="v1",
            data=None,
            error=error,
        ).model_dump(),
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    request_id = _get_request_id(request)
    error = ErrorObject(
        code=ErrorCode.UPSTREAM_ERROR if exc.status_code >= 500 else ErrorCode.FORBIDDEN,
        message=exc.detail,
        details=None,
    )
    return JSONResponse(
        status_code=exc.status_code,
        content=ApiResponse(
            ok=False,
            request_id=request_id,
            api_version="v1",
            data=None,
            error=error,
        ).model_dump(),
    )


@app.exception_handler(Exception)
async def fallback_exception_handler(request: Request, exc: Exception):
    request_id = getattr(request.state, "request_id", "unknown")
    logger.exception(
        "Unhandled server error",
        extra={"request_id": request_id, "path": request.url.path, "method": request.method},
    )
    return JSONResponse(
        status_code=500,
        content=ApiResponse(
            ok=False,
            request_id=request_id,
            error=ErrorObject(code=ErrorCode.INTERNAL_ERROR, message="Unexpected server error"),
        ).model_dump(),
    )


# ======================
# Routers
# ======================
app.include_router(generate_router, prefix="/ai", tags=["ai"])
app.include_router(history_router, prefix="/ai", tags=["ai"])
app.include_router(results_router, prefix="/ai", tags=["ai"])
app.include_router(dashboard_router, prefix="/ai", tags=["ai"])
app.include_router(place_insights_router)
app.include_router(reviews_router)


# ======================
# Health / Me
# ======================

@app.get("/")
def health():
    return {"status": "ok"}


@app.get("/ai/me")
def me(request: Request, user=Depends(get_current_user)):
    return {"id": str(user.id), "email": user.email}
