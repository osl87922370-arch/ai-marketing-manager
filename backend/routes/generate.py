from fastapi import APIRouter, Request, Depends
from datetime import datetime, timezone
import time

from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..db import get_db
from ..model.generation import Generation as GenerationModel

from ..schemas.generate import (
    GenerateRequest,
    GenerateResponse,
    Generation,
    GenerationOutput,
    Variant,
    Usage,
)

from ..utils.pricing import calc_credits


router = APIRouter(tags=["ai"])


@router.post("/generate", response_model=GenerateResponse)
async def generate(
    payload: GenerateRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):


    t0 = time.time()

    # 👉 MVP용 더미 variants (나중에 LLM 연결)
    
    37  # 👉 MVP용 입력값 기반 더미 variants (나중에 LLM 연결)


    # 👉 MVP용 입력값 기반 더미 variants (나중에 LLM 연결)

    product = (getattr(payload, "product_name", "") or "").strip()
    target = (getattr(payload, "target", "") or "").strip()
    tone = (getattr(payload, "tone", "") or "").strip()
    

    if not product:
       product = "추천 상품"
    if not target:
       target = "고객"
    if not tone:
        tone = "친근"

    variants = [
        Variant(
            headline=f"{target}에게 딱 맞는 {product}",
            body=f"{tone} 분위기로 소개하는 {product}입니다.",
            cta="지금 확인해보세요",
            hashtags=["#매장홍보", "#방문유도", "#마케팅카피"],
        ),
        Variant(
            headline=f"오늘 눈길 가는 메뉴, {product}",
            body=f"{target}도 부담 없이 관심 가질 수 있게 {tone} 톤으로 풀어낸 카피입니다.",
            cta="지금 방문해보세요",
            hashtags=["#맛집홍보", "#로컬마케팅", "#카피라이팅"],
        ),
        Variant(
            headline=f"{product} 찾는 순간 선택은 더 쉬워집니다",
            body=f"{product}의 매력을 {tone} 느낌으로 전달하는 홍보 문구입니다.",
            cta="매장 정보 보기",
            hashtags=["#소상공인마케팅", "#콘텐츠마케팅", "#AI카피"],
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
        created_at=datetime.now(timezone.utc),
        output=GenerationOutput(variants=variants),
        usage=usage,
    )

    db_generation = GenerationModel(
        user_id=current_user.id,
        task="generate",
        input_json={
            "target": getattr(payload, "target", ""),
            "channel": getattr(payload, "channel", ""),
            "goal": getattr(payload, "goal", ""),
            "product_name": getattr(payload, "product_name", ""),
            "params": payload.params.model_dump() if getattr(payload, "params", None) else {},
        },
        output_json=generation.output.model_dump(),
        headline=generation.output.variants[0].headline if generation.output.variants else None,
        status=generation.status,
    )
    

    db.add(db_generation)
    db.commit()
    db.refresh(db_generation)

    generation.id = db_generation.id

    return GenerateResponse(
        ok=True,
        request_id=getattr(request.state, "request_id", "req_test"),
        api_version="v1",
        generation=generation,
        error=None,
    )
    