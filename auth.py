from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy.orm import Session
security = HTTPBearer()


import crud
from db import get_db

# 운영에서는 .env로 빼기
SECRET_KEY = "CHANGE_ME_TO_A_LONG_RANDOM_STRING"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

bearer_scheme = HTTPBearer(auto_error=True)


def create_access_token(payload: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = payload.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(
    cred: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
):
    token = cred.credentials

    cred_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authentication",
        headers={"WWW-Authenticate": "Bearer"},
    )



    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: Optional[str] = payload.get("sub")
        if not email:
            raise cred_exc
    except JWTError:
        raise cred_exc

    user = crud.get_user_by_email(db, email)
    if not user:
        raise cred_exc
    return user

# ===== Supabase JWT local verification =====

import os
import time
import jwt
from jwt import PyJWKClient
from dotenv import load_dotenv
from fastapi import Request, HTTPException

load_dotenv()

SUPABASE_PROJECT_URL = os.getenv("SUPABASE_PROJECT_URL", "").rstrip("/")
SUPABASE_JWT_ISS = os.getenv("SUPABASE_JWT_ISS", "")
SUPABASE_JWT_AUD = os.getenv("SUPABASE_JWT_AUD", "authenticated")

JWKS_URL = f"{SUPABASE_PROJECT_URL}/auth/v1/.well-known/jwks.json"

_jwk_client = None
_jwk_expires_at = 0
_JWK_TTL = 6 * 60 * 60

def _get_jwk_client():
    global _jwk_client, _jwk_expires_at
    now = time.time()
    if _jwk_client is None or now >= _jwk_expires_at:
        _jwk_client = PyJWKClient(JWKS_URL)
        _jwk_expires_at = now + _JWK_TTL
    return _jwk_client

def _get_bearer_token(request: Request) -> str:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token")
    return auth.split(" ", 1)[1].strip()

def get_current_user_supabase(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    token = credentials.credentials

    print("RAW TOKEN >>>", token)
    print("TOKEN TYPE >>>", type(token))
    print("DOT COUNT >>>", token.count("."))

    parts = token.split(".")
    print("JWT PARTS LEN >>>", len(parts))
    print("JWT PARTS HEAD >>>", [p[:12] for p in parts])
    print("JWT REPR >>>", repr(token))


    try:
        signing_key = _get_jwk_client().get_signing_key_from_jwt(token).key

        claims = jwt.decode(
            token,
            signing_key,
            algorithms=["ES256"],
            issuer=SUPABASE_JWT_ISS,
            audience=SUPABASE_JWT_AUD,
            options={
                "require": ["exp", "iss", "aud"],
                "verify_exp": True,
                "verify_iss": True,
                "verify_aud": True,
            },
        )

        return claims

    except Exception as e:
        print("JWT VERIFY ERROR:", type(e).__name__, str(e))
        raise HTTPException(
            status_code=401,
            detail=f"Invalid Supabase token: {type(e).__name__} {e}"
        )
