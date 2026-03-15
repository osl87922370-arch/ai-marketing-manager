from fastapi import APIRouter, Request, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import time
import uuid
import os
import json

from openai import OpenAI

from schemas.generate import (
    GenerateRequest,
    GenerateResponse,
    Generation,
    GenerationOutput,
    Variant,
    Usage,
)
from utils.pricing import calc_credits
from db import get_db
from auth import get_current_user
from model.generation import Generation as GenerationModel

router = APIRouter(tags=["ai"])

_openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

TONE_MAP = {
    "친근": "친근하고 따뜻한 말투",
    "전문": "신뢰감 있고 전문적인 말투",
    "유머": "유머러스하고 재치 있는 말투",
    "하드셀": "강렬하고 구매를 직접 촉구하는 말투",
}


def _build_prompt(payload: GenerateRequest) -> str:
    tone_desc = TONE_MAP.get(payload.input.get("tone", "친근"), "친근하고 따뜻한 말투")
    product_desc = payload.input.get("product_desc") or payload.product_name or ""
    variant_count = payload.params.variant_count

    return f"""당신은 SNS 마케팅 카피라이터입니다.

아래 정보를 바탕으로 인스타그램 마케팅 카피를 {variant_count}가지 버전으로 작성해주세요.

[상품/서비스 설명]
{product_desc}

[타겟]
{payload.target}

[채널]
{payload.channel}

[목표]
{payload.goal}

[말투]
{tone_desc}

각 버전마다 다른 전략(긴급성, 가성비, 품질, 감성 등)을 사용해주세요.

반드시 아래 JSON 형식으로만 응답하세요 (다른 텍스트 없이):
{{
  "variants": [
    {{
      "headline": "헤드라인 (15자 이내)",
      "body": "본문 카피 (50-80자)",
      "cta": "행동 유도 문구 (10자 이내)",
      "hashtags": ["해시태그1", "해시태그2", "해시태그3"]
    }}
  ]
}}"""


@router.post("/generate", response_model=GenerateResponse)
async def generate(
    payload: GenerateRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    t0 = time.time()
    variant_count = payload.params.variant_count

    # GPT-4o 호출
    try:
        response = _openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "당신은 SNS 마케팅 전문 카피라이터입니다. 반드시 JSON만 응답합니다."},
                {"role": "user", "content": _build_prompt(payload)},
            ],
            temperature=0.8,
            response_format={"type": "json_object"},
        )
        raw = response.choices[0].message.content or "{}"
        parsed = json.loads(raw)
        raw_variants = parsed.get("variants", [])[:variant_count]
        total_tokens = response.usage.total_tokens if response.usage else None
        model_used = "gpt-4o"
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"LLM 호출 실패: {e}")

    variants = [
        Variant(
            headline=v.get("headline", ""),
            body=v.get("body", ""),
            cta=v.get("cta"),
            hashtags=v.get("hashtags"),
        )
        for v in raw_variants
    ]

    if not variants:
        raise HTTPException(status_code=502, detail="LLM이 variants를 반환하지 않았습니다.")

    pricing = calc_credits(variant_count=len(variants))
    latency_ms = int((time.time() - t0) * 1000)

    usage = Usage(
        total_tokens=total_tokens,
        variant_count=len(variants),
        credit_used=pricing.credit_used,
        pricing_version=pricing.pricing_version,
        breakdown=pricing.breakdown,
        model=model_used,
        latency_ms=latency_ms,
    )

    gen_id = str(uuid.uuid4())

    db_gen = GenerationModel(
        id=gen_id,
        user_id=str(current_user.id),
        task=payload.task,
        input_json=payload.model_dump(),
        headline=variants[0].headline,
        body=variants[0].body,
        cta=variants[0].cta,
        hashtags=variants[0].hashtags,
        model=model_used,
        latency_ms=latency_ms,
    )
    db.add(db_gen)
    db.commit()

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
