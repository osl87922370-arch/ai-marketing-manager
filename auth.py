
from __future__ import annotations

# backend/auth.py
import os
import time
from typing import Any, Dict, Optional

import jwt  # PyJWT
from jwt import PyJWKClient
from dotenv import load_dotenv

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# ✅ (추가) DB 세션 + DB Dependency + User ORM
from sqlalchemy.orm import Session
from db import get_db
from model.user import User

load_dotenv()

bearer_scheme = HTTPBearer(auto_error=True)

# ===== Supabase env =====
SUPABASE_PROJECT_URL = os.getenv("SUPABASE_PROJECT_URL", "").rstrip("/")
SUPABASE_JWT_ISS = os.getenv("SUPABASE_JWT_ISS", "").rstrip("/")
SUPABASE_JWT_AUD = os.getenv("SUPABASE_JWT_AUD", "authenticated")
DEBUG_AUTH = True

if DEBUG_AUTH:
    print("ISS:", SUPABASE_JWT_ISS)
    print("AUD:", SUPABASE_JWT_AUD)


if not SUPABASE_PROJECT_URL:
    raise RuntimeError("Missing env: SUPABASE_PROJECT_URL")
if not SUPABASE_JWT_ISS:
    raise RuntimeError("Missing env: SUPABASE_JWT_ISS")

JWKS_URL = f"{SUPABASE_PROJECT_URL}/auth/v1/.well-known/jwks.json"

# ===== JWKS client cache =====
_JWK_CLIENT: Optional[PyJWKClient] = None
_JWK_EXPIRES_AT = 0.0
_JWK_TTL_SECONDS = 6 * 60 * 60  # 6h


def _get_jwk_client() -> PyJWKClient:
    global _JWK_CLIENT, _JWK_EXPIRES_AT
    now = time.time()
    if _JWK_CLIENT is None or now >= _JWK_EXPIRES_AT:
        _JWK_CLIENT = PyJWKClient(JWKS_URL)
        _JWK_EXPIRES_AT = now + _JWK_TTL_SECONDS
    return _JWK_CLIENT


def _unauthorized(detail: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def _safe_decode_jwt_header(token: str) -> Dict[str, Any]:
    # 헤더 확인용 (디버깅/검증용). 실패해도 예외 던짐.
    return jwt.get_unverified_header(token)


def get_current_user(
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> User:
    """
    Supabase access_token(JWT) 로컬 검증:
    - 서명 검증: JWKS 공개키
    - iss/aud/exp 검증
    반환: claims(dict)
    """
    token = (credentials.credentials or "").strip()
    if token.count(".") != 2:
        raise _unauthorized("Invalid token format (not a JWT)")

    # 1) 토큰 헤더의 alg를 먼저 확인 (지금까지 에러의 핵심 포인트)
    try:
        header = _safe_decode_jwt_header(token)
        alg = header.get("alg")
        if not alg:
            raise _unauthorized("JWT header missing alg")
    except Exception as e:
        raise _unauthorized(f"Invalid token header: {type(e).__name__} {e}")

    # 2) JWKS에서 해당 토큰에 맞는 공개키 획득
    try:
        signing_key = _get_jwk_client().get_signing_key_from_jwt(token).key
    except Exception as e:
        # 여기서 401/404가 나면 JWKS_URL 또는 네트워크 문제
        raise _unauthorized(f"Failed to load JWKS signing key: {type(e).__name__} {e}")

    # 3) 서명 + 클레임 검증
    # Supabase는 보통 RS256을 사용하지만, 헤더 alg를 기반으로 허용 목록에 포함되도록 설정
    allowed_algs = ["RS256", "ES256"]
    if alg not in allowed_algs:
        raise _unauthorized(f"Unexpected JWT alg: {alg} (allowed: {allowed_algs})")

    try:
        claims = jwt.decode(
            token,
            signing_key,
            algorithms=[alg],  # 헤더 alg 그대로 사용
            issuer=SUPABASE_JWT_ISS,
            audience=SUPABASE_JWT_AUD,
            options={
                "require": ["exp", "iss", "aud"],
                "verify_signature": True,
                "verify_exp": True,
                "verify_iss": True,
                "verify_aud": True,
            },
        )
    except Exception as e:
        raise _unauthorized(f"Invalid Supabase token: {type(e).__name__} {e}")

   # ✅ 이 아래부터 함수 안쪽 동일 레벨이어야 함

    
        supabase_user_id = claims.get("sub")
        if not supabase_user_id:
            raise _unauthorized("Invalid token payload")

        email = claims.get("email")

        user = db.query(User).filter(User.supabase_id == supabase_user_id).first()

        if not user:
            user = User(
                supabase_id=supabase_user_id,
                email=email,
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        return user
   


