from __future__ import annotations

import json
from typing import List

from fastapi import HTTPException
from openai import OpenAI

from core.config import OPENAI_API_KEY
from models.place_insights import ReviewRow
from schemas.place_insights import PlaceInsightContext

_client = OpenAI(api_key=OPENAI_API_KEY)

_SYSTEM_PROMPT = "당신은 마케팅 인사이트 분석 전문가입니다. 반드시 JSON만 응답합니다."

_USER_PROMPT_TEMPLATE = """아래는 실제 고객 리뷰 {count}개입니다.

{reviews}

위 리뷰들을 분석하여 마케팅에 활용할 인사이트를 추출해주세요.

반드시 아래 JSON 형식으로만 응답하세요:
{{
  "keywords": ["자주 등장하는 핵심 키워드 5-10개"],
  "features": ["상품/서비스의 특장점 3-5개"],
  "benefits": ["고객이 실제로 느끼는 이점 3-5개"],
  "proofs": ["신뢰 증거: 재방문, 추천, 구체적 사례 3-5개"],
  "pain_points": ["고객 불만 또는 개선 요청 사항 2-4개"],
  "objections": ["구매/방문을 망설이게 하는 요소 2-4개"]
}}"""


def extract_insights(reviews: List[ReviewRow], dataset_id: str) -> PlaceInsightContext:
    if not reviews:
        raise HTTPException(status_code=400, detail="분석할 리뷰가 없습니다.")

    review_texts = "\n".join(
        f"{i + 1}. {r.review_text}" for i, r in enumerate(reviews[:50])
    )

    prompt = _USER_PROMPT_TEMPLATE.format(count=len(reviews[:50]), reviews=review_texts)

    try:
        response = _client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": _SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
            response_format={"type": "json_object"},
        )
        raw = response.choices[0].message.content or "{}"
        data = json.loads(raw)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"인사이트 추출 실패: {e}")

    return PlaceInsightContext(
        dataset_id=dataset_id,
        keywords=data.get("keywords", []),
        features=data.get("features", []),
        benefits=data.get("benefits", []),
        proofs=data.get("proofs", []),
        pain_points=data.get("pain_points", []),
        objections=data.get("objections", []),
    )
