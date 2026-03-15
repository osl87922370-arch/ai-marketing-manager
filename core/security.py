from __future__ import annotations

import time
from typing import Any, Dict, Optional

import jwt
from jwt import PyJWKClient

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from core.config import SUPABASE_PROJECT_URL, SUPABASE_JWT_ISS, SUPABASE_JWT_AUD, DEBUG_AUTH
from core.db import get_db
from models.user import User

bearer_scheme = HTTPBearer(auto_error=True)

if not SUPABASE_PROJECT_URL:
    raise RuntimeError("Missing env: SUPABASE_PROJECT_URL")
if not SUPABASE_JWT_ISS:
    raise RuntimeError("Missing env: SUPABASE_JWT_ISS")

JWKS_URL = f"{SUPABASE_PROJECT_URL}/auth/v1/.well-known/jwks.json"

if DEBUG_AUTH:
    print("ISS:", SUPABASE_JWT_ISS)
    print("AUD:", SUPABASE_JWT_AUD)

# JWKS client cache
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
    return jwt.get_unverified_header(token)


def get_current_user(
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> User:
    token = (credentials.credentials or "").strip()
    if token.count(".") != 2:
        raise _unauthorized("Invalid token format (not a JWT)")

    try:
        header = _safe_decode_jwt_header(token)
        alg = header.get("alg")
        if not alg:
            raise _unauthorized("JWT header missing alg")
    except Exception as e:
        raise _unauthorized(f"Invalid token header: {type(e).__name__} {e}")

    try:
        signing_key = _get_jwk_client().get_signing_key_from_jwt(token).key
    except Exception as e:
        raise _unauthorized(f"Failed to load JWKS signing key: {type(e).__name__} {e}")

    allowed_algs = ["RS256", "ES256"]
    if alg not in allowed_algs:
        raise _unauthorized(f"Unexpected JWT alg: {alg} (allowed: {allowed_algs})")

    try:
        claims = jwt.decode(
            token,
            signing_key,
            algorithms=[alg],
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

    supabase_user_id = claims.get("sub")
    if not supabase_user_id:
        raise _unauthorized("Invalid token payload")

    email = claims.get("email")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(email=email)
        db.add(user)
        db.commit()
        db.refresh(user)

    return user
