from __future__ import annotations

import json
import os
import time
import uuid
from datetime import datetime, timezone
from typing import List, Tuple

from fastapi import HTTPException
from openai import OpenAI

from core.config import OPENAI_API_KEY
from models.generation import Generation as GenerationModel
from schemas.generate import GenerateRequest, GenerationOutput, Variant, Usage
from utils.pricing import calc_credits
from utils.prompt_builder import build_prompt

_client = OpenAI(api_key=OPENAI_API_KEY)


def call_llm(payload: GenerateRequest) -> Tuple[List[Variant], int, str]:
    """GPT-4o 호출 → (variants, total_tokens, model_name)"""
    try:
        response = _client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": "당신은 SNS 마케팅 전문 카피라이터입니다. 반드시 JSON만 응답합니다.",
                },
                {"role": "user", "content": build_prompt(payload)},
            ],
            temperature=0.8,
            response_format={"type": "json_object"},
        )
        raw = response.choices[0].message.content or "{}"
        parsed = json.loads(raw)
        raw_variants = parsed.get("variants", [])[: payload.params.variant_count]
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

    return variants, total_tokens, model_used


def build_generation_record(
    payload: GenerateRequest,
    user_id: str,
    variants: List[Variant],
    model_used: str,
    latency_ms: int,
) -> Tuple[GenerationModel, str, Usage]:
    """DB 저장 객체와 generation_id, usage 반환"""
    pricing = calc_credits(variant_count=len(variants))
    gen_id = str(uuid.uuid4())

    db_gen = GenerationModel(
        id=gen_id,
        user_id=user_id,
        task=payload.task,
        input_json=payload.model_dump(),
        headline=variants[0].headline,
        body=variants[0].body,
        cta=variants[0].cta,
        hashtags=variants[0].hashtags,
        model=model_used,
        latency_ms=latency_ms,
    )

    usage = Usage(
        total_tokens=None,
        variant_count=len(variants),
        credit_used=pricing.credit_used,
        pricing_version=pricing.pricing_version,
        breakdown=pricing.breakdown,
        model=model_used,
        latency_ms=latency_ms,
    )

    return db_gen, gen_id, usage
