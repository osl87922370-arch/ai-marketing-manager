
from dotenv import load_dotenv
load_dotenv()

import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI
from fastapi import Depends 
from .auth import get_current_user
from .routes.place_insights import router as place_insights_router
from .routes.reviews import router as reviews_router
from .routes.results import router as results_router
from fastapi.security import HTTPBearer
from fastapi import Request 
import uuid
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from .schemas.response import ApiResponse
from .schemas.error import ErrorObject, ErrorDetails, FieldError, ErrorCode
from .db import Base, engine 
from .import model  # ← 여기에
from .model import User   # ← 이 줄 추가
# ======================
# App
# ======================

app = FastAPI()
app.include_router(place_insights_router)
app.include_router(reviews_router)
app.include_router(results_router, prefix="/ai")
security = HTTPBearer()
@app.middleware("http")
async def request_id_middleware(request: Request, call_next):
    rid = get_request_id(request)
    request.state.request_id = rid
    response = await call_next(request)
    response.headers["x-request-id"] = rid
    return response
def get_request_id(request: Request) -> str:
    rid = request.headers.get("x-request-id")
    if rid:
        return rid
    return f"req_{uuid.uuid4().hex[:12]}"

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
    
     request_id = get_request_id(request)

    field_errors = [
        FieldError(
            field=".".join(map(str, err["loc"])),
            reason=err["msg"]
        )
        for err in exc.errors()
    ]

    error = ErrorObject(
        code=ErrorCode.VALIDATION_ERROR,
        message="Request validation failed",
        details=ErrorDetails(field_errors=field_errors)
    )

    return JSONResponse(
        status_code=422,
        content=ApiResponse(
            ok=False,
            request_id=request_id,
            api_version="v1",
            data=None,
            error=error
        ).dict()
    )

    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
     request_id = get_request_id(request)

    error = ErrorObject(
        code=ErrorCode.UPSTREAM_ERROR if exc.status_code >= 500 else ErrorCode.FORBIDDEN,
        message=exc.detail,
        details=None
    )

    return JSONResponse(
        status_code=exc.status_code,
        content=ApiResponse(
            ok=False,
            request_id=request_id,
            api_version="v1",
            data=None,
            error=error
        ).dict()
    )
# ======================
# DB (Postgres / Supabase)
# ======================














def get_or_create_user(db, email: str) -> User:
    u = db.query(User).filter(User.email == email).first()
    if u:
        return u
    u = User(email=email)
    db.add(u)
    db.commit()
    db.refresh(u)
    return u



app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ======================
# OpenAI
# ======================

api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise RuntimeError("OPENAI_API_KEY is not set")

client = OpenAI(api_key=api_key)

# ======================
# Models
# ======================

from pydantic import BaseModel, EmailStr

class GenerateRequest(BaseModel):
    task: str
    input: dict
    userEmail: EmailStr

# =====================
# Global Exception Handlers
# =====================

import logging
from fastapi import Request
from fastapi.responses import JSONResponse

from .schemas.response import ApiResponse
from .schemas.error import ErrorObject, ErrorCode

logger = logging.getLogger(__name__)


@app.exception_handler(Exception)
async def fallback_exception_handler(request: Request, exc: Exception):
    request_id = getattr(request.state, "request_id", None)

    logger.exception(
        "Unhandled server error",
        extra={
            "request_id": request_id,
            "path": request.url.path,
            "method": request.method,
        },
    )

    response = ApiResponse(
    ok=False,
    request_id=request_id or "unknown",
    error=ErrorObject(
        code=ErrorCode.INTERNAL_ERROR,
        message="Unexpected server error",
    ),
)

    return JSONResponse(
        status_code=500,
        content=response.model_dump(),
    )
# ======================
# Health check
# ======================

@app.get("/")
def health():
    return {"status": "ok"}



@app.get("/ai/me")
def me(request: Request, user=Depends(get_current_user)):
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return {
        "id": str(user.id),
        "email": user.email,
    }


# ======================
# AI Generate
# ======================



from .routes.history import router as history_router
from .routes.generate import router as generate_router

app.include_router(history_router, prefix="/ai", tags=["ai"])
app.include_router(generate_router, prefix="/ai", tags=["ai"])



Base.metadata.create_all(bind=engine)