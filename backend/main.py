from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from datetime import datetime
from typing import List
import secrets
import sqlite3

# =========================
# App
# =========================
app = FastAPI()

# =========================
# CORS (프론트 허용)
# =========================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# SQLite DB 유틸
# =========================
DB_PATH = "results.db"

def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
    CREATE TABLE IF NOT EXISTS results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_email TEXT NOT NULL,
        product_desc TEXT NOT NULL,
        target TEXT NOT NULL,
        tone TEXT NOT NULL,
        result_text TEXT NOT NULL,
        created_at TEXT NOT NULL
    )
    """)
    conn.commit()
    conn.close()

init_db()

# =========================
# Schemas
# =========================
class UserCreate(BaseModel):
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class GenerateIn(BaseModel):
    product_desc: str = Field(min_length=1)
    target: str = Field(min_length=1)
    tone: str = Field(min_length=1)

class GenerateOut(BaseModel):
    result_text: str

class SaveResultIn(BaseModel):
    user_email: str
    product_desc: str
    target: str
    tone: str
    result_text: str

class SaveResultOut(BaseModel):
    id: int

class ResultItem(BaseModel):
    id: int
    user_email: str
    product_desc: str
    target: str
    tone: str
    result_text: str
    created_at: str

# =========================
# In-memory user store (MVP)
# 서버 재시작하면 초기화됨
# =========================
users = {}

# =========================
# Routes
# =========================
@app.get("/")
def root():
    return {"status": "ok"}

# ---- Auth ----
@app.post("/api/auth/register")
def register(data: UserCreate):
    if data.email in users:
        raise HTTPException(status_code=400, detail="User already exists")
    users[data.email] = data.password
    return {"email": data.email}

@app.post("/api/auth/login", response_model=Token)
def login(data: UserLogin):
    if users.get(data.email) != data.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = secrets.token_urlsafe(32)
    return {"access_token": token, "token_type": "bearer"}

# ---- Generate ----
@app.post("/api/generate", response_model=GenerateOut)
def generate(body: GenerateIn):
    tone_map = {
        "친근": "친근하게",
        "전문": "전문적으로",
        "유머": "유머러스하게",
        "하드셀": "강하게 설득하는 톤으로",
    }
    tone_desc = tone_map.get(body.tone, body.tone)

    result = (
        f"[{tone_desc} 작성된 홍보문]\n\n"
        f"타겟: {body.target}\n"
        f"상품: {body.product_desc}\n\n"
        f"✅ 한 줄 카피: '{body.target}에게 딱 맞는 선택, 지금 바로 경험해보세요.'\n"
        f"✅ CTA: 지금 클릭하고 상세 확인 →"
    )
    return GenerateOut(result_text=result)

# ---- Results (Save/List/Detail) ----
@app.post("/api/results", response_model=SaveResultOut)
def save_result(body: SaveResultIn):
    conn = get_conn()
    cur = conn.cursor()
    created_at = datetime.utcnow().isoformat()

    cur.execute(
        """
        INSERT INTO results (user_email, product_desc, target, tone, result_text, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (body.user_email, body.product_desc, body.target, body.tone, body.result_text, created_at),
    )
    conn.commit()
    new_id = cur.lastrowid
    conn.close()
    return {"id": new_id}

@app.get("/api/results", response_model=List[ResultItem])
def list_results(user_email: str):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "SELECT * FROM results WHERE user_email = ? ORDER BY id DESC",
        (user_email,),
    )
    rows = cur.fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.get("/api/results/{result_id}", response_model=ResultItem)
def get_result(result_id: int):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT * FROM results WHERE id = ?", (result_id,))
    row = cur.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Result not found")

    return dict(row)
