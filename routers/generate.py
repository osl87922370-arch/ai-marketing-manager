import time
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from core.db import get_db
from core.security import get_current_user
from repositories.generation_repository import save_generation
from schemas.generate import (
    Generation,
    GenerateRequest,
    GenerateResponse,
    GenerationOutput,
)
from services.generation_service import build_generation_record, call_llm
from utils.utm import apply_utm_to_text, build_utm_params

router = APIRouter(tags=["ai"])


@router.post("/generate", response_model=GenerateResponse)
async def generate(
    payload: GenerateRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    t0 = time.time()

    variants, total_tokens, model_used = call_llm(payload)

    latency_ms = int((time.time() - t0) * 1000)

    # 프로 사용자: UTM 파라미터 자동 적용
    if current_user.plan == "pro":
        channel = payload.channel or (payload.input or {}).get("channel", "")
        product = payload.product_name or (payload.input or {}).get("product_name", "")
        for v in variants:
            utm_params = build_utm_params(channel, product, "")
            if hasattr(v, "body") and v.body:
                v.body = apply_utm_to_text(v.body, utm_params)
            if hasattr(v, "cta") and v.cta:
                v.cta = apply_utm_to_text(v.cta, utm_params)

    db_gen, gen_id, usage = build_generation_record(
        payload=payload,
        user_id=str(current_user.id),
        variants=variants,
        model_used=model_used,
        latency_ms=latency_ms,
    )
    usage.total_tokens = total_tokens

    # UTM 파라미터에 generation_id 적용 (프로 사용자)
    if current_user.plan == "pro":
        channel = payload.channel or (payload.input or {}).get("channel", "")
        product = payload.product_name or (payload.input or {}).get("product_name", "")
        utm_params = build_utm_params(channel, product, gen_id)
        for v in variants:
            if hasattr(v, "body") and v.body:
                v.body = apply_utm_to_text(v.body, utm_params)
            if hasattr(v, "cta") and v.cta:
                v.cta = apply_utm_to_text(v.cta, utm_params)

    save_generation(db, db_gen)

    generation = Generation(
        id=gen_id,
        status="succeeded",
        created_at=datetime.now(timezone.utc).isoformat(),
        output=GenerationOutput(variants=variants),
        usage=usage,
    )

    return GenerateResponse(
        ok=True,
        request_id=getattr(request.state, "request_id", "req_test"),
        api_version="v1",
        generation=generation,
        error=None,
    )
