
from dotenv import load_dotenv
load_dotenv()

import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI
from fastapi import Depends 
from auth import get_current_user

from fastapi.security import HTTPBearer
from fastapi import Request 
import uuid
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from schemas.response import ApiResponse
from schemas.error import ErrorObject, ErrorDetails, FieldError, ErrorCode
# ======================
# App
# ======================

app = FastAPI()
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

import uuid
from datetime import datetime
from sqlalchemy import create_engine, Column, String, DateTime, ForeignKey, Text, Integer
from sqlalchemy import JSON
from sqlalchemy.dialects.postgresql import UUID

from sqlalchemy.orm import declarative_base, sessionmaker, relationship

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Generation(Base):
    __tablename__ = "generations"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)

    task = Column(String, nullable=False)
    
    input_json = Column(JSON, nullable=False)

    headline = Column(Text, nullable=False)
    body = Column(Text, nullable=False)
    cta = Column(String, nullable=False)
    
    hashtags = Column(JSON, nullable=False)

    model = Column(String, nullable=True)
    latency_ms = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    user = relationship("User")

Base.metadata.create_all(bind=engine)

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

from schemas.response import ApiResponse
from schemas.error import ErrorObject, ErrorCode

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
    return user

# ======================
# AI Generate
# ======================






   
   


Base.metadata.create_all(bind=engine)

from routes.history import router as history_router
from routes.generate import router as generate_router

app.include_router(history_router, prefix="/ai", tags=["ai"])
app.include_router(generate_router, prefix="/ai", tags=["ai"])



