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
    
    variants = [
    Variant(
        headline="이번 주말 줄 서서 먹는 닭볶음탕",
        body="강남주말포차에서 푸짐한 양의 닭볶음탕을 즐겨보세요. 주말 야식으로 딱입니다.",
        cta="지금 방문해보세요",
        hashtags=["#강남맛집", "#닭볶음탕", "#주말야식"]
    ),
    Variant(
        headline="강남역에서 찾은 푸짐한 한 끼",
        body="매콤한 닭볶음탕 한 냄비로 주말 저녁을 든든하게 채워보세요.",
        cta="오늘 저녁 메뉴로 추천",
        hashtags=["#강남역맛집", "#한식추천", "#저녁메뉴"]
    ),
    Variant(
        headline="주말 모임 메뉴로 딱 좋은 닭볶음탕",
        body="강남주말포차의 닭볶음탕은 푸짐한 양과 깊은 맛으로 만족도를 높여줍니다.",
        cta="친구와 함께 방문해보세요",
        hashtags=["#모임맛집", "#강남포차", "#닭볶음탕추천"]
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
        task=payload.task,
        input_json={
            "userEmail": payload.userEmail,
            "input": payload.input,
            "target": payload.target,
            "channel": payload.channel,
            "goal": payload.goal,
            "product_name": payload.product_name,
            "params": payload.params.model_dump(),
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
    