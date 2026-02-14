from __future__ import annotations

import secrets
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session

import crud
from db import get_db
from schemas import UserCreate, UserLogin, UserOut, Token

app = FastAPI()


@app.get("/")
def root():
    return {"status": "ok"}


@app.post("/api/auth/register", response_model=UserOut)
def register(data: UserCreate, db: Session = Depends(get_db)):
    user = crud.create_user(db, data)
    return user


@app.post("/api/auth/login", response_model=Token)
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = crud.authenticate_user(db, data.email, data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # ✅ OAuth/JWT 없이도 테스트 가능한 임시 토큰
    access_token = secrets.token_urlsafe(32)
    return {"access_token": access_token, "token_type": "bearer"}
