from fastapi import APIRouter, Request
from datetime import datetime, timezone
import time

from schemas.generate import (
    GenerateRequest,
    GenerateResponse,
    Generation,
    GenerationOutput,
    Variant,
)
from schemas.usage import Usage
from utils.pricing import calc_credits

router = APIRouter(tags=["ai"])



@router.post("/generate", response_model=GenerateResponse)
async def generate(payload: GenerateRequest, request: Request):
    t0 = time.time()

    # 👉 MVP용 더미 variants (나중에 LLM 연결)
    variants = [
        Variant(
            id="v1",
            label="강한 후킹",
            text="이번 주말 줄 서서 먹는 그 맛!",
            reason="긴급성 + 사회적 증거",
        ),
        Variant(
            id="v2",
            label="혜택 중심",
            text="런치 세트 9,900원! 든든하게 즐기세요",
            reason="가격 앵커",
        ),
        Variant(
            id="v3",
            label="신뢰 강조",
            text="매일 직접 손질한 신선한 재료",
            reason="품질 근거",
        ),
    ]

    # 💰 크레딧 계산
    pricing = calc_credits(variant_count=len(variants))

    usage = Usage(
        total_tokens=None,
        variant_count=len(variants),
        credit_used=pricing.credit_used,
        pricing_version=pricing.pricing_version,
        breakdown=pricing.breakdown,
        model=None,
        latency_ms=int((time.time() - t0) * 1000),
    )

    generation = Generation(
        id="gen_001",
        status="succeeded",
        created_at=datetime.now(timezone.utc).isoformat(),
        output=GenerationOutput(variants=variants),
        usage=usage,
    )

    return GenerateResponse(
        ok=True,
        request_id=getattr(request.state, "request_id", "req_test"),
        api_version=payload.api_version,
        generation=generation,
        error=None,
    )