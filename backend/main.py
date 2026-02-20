
from dotenv import load_dotenv
load_dotenv()

import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI
from fastapi import Depends, Request
from auth import get_current_user

from fastapi.security import HTTPBearer

# ======================
# App
# ======================

app = FastAPI(debug=True)
security = HTTPBearer()

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



@app.post("/ai/generate")
def generate(req: GenerateRequest):

    # 1️⃣ 프롬프트 생성
    prompt = f"..."

    # 2️⃣ OpenAI 호출
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
    )

    # 3️⃣ 결과 추출
    text = response.choices[0].message.content or ""

    # 4️⃣ DB 저장
    db = SessionLocal()
    try:
        user = get_or_create_user(db, req.userEmail)

        g = Generation(
            user_id=user.id,
            task=req.task,
            input_json=req.input,
            headline=text,
            body=text,
            cta="자세히 보기",
            hashtags=["#카페", "#할인", "#이벤트"],
            model="gpt-4o-mini",
            latency_ms=None,
        )

        db.add(g)
        db.commit()
        db.refresh(g)

        return {
            "headline": text,
            "body": text,
            "cta": "자세히 보기",
            "hashtags": ["#카페", "#할인", "#이벤트"],
            "generationId": str(g.id),
        }

    finally:
        db.close()




Base.metadata.create_all(bind=engine)

from routes.history import router as history_router
app.include_router(history_router)

