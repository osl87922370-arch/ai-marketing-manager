from __future__ import annotations

import json
from abc import ABC, abstractmethod
from typing import List

from fastapi import HTTPException
from openai import OpenAI

from core.config import OPENAI_API_KEY
from schemas.generate import Variant
from schemas.place_insights import PlaceInsightContext

_client = OpenAI(api_key=OPENAI_API_KEY)


class BaseAgent(ABC):
    """채널별 마케팅 카피 생성 에이전트 기반 클래스."""

    channel: str = ""

    @abstractmethod
    def _build_prompt(self, insights: PlaceInsightContext, variant_count: int) -> str: ...

    def generate(self, insights: PlaceInsightContext, variant_count: int) -> List[Variant]:
        prompt = self._build_prompt(insights, variant_count)
        try:
            response = _client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "system",
                        "content": "당신은 마케팅 카피라이터입니다. 반드시 JSON만 응답합니다.",
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.8,
                response_format={"type": "json_object"},
            )
            raw = response.choices[0].message.content or "{}"
            data = json.loads(raw)
            raw_variants = data.get("variants", [])[:variant_count]
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"카피 생성 실패 ({self.channel}): {e}")

        if not raw_variants:
            raise HTTPException(status_code=502, detail="LLM이 variants를 반환하지 않았습니다.")

        return [
            Variant(
                headline=v.get("headline", ""),
                body=v.get("body", ""),
                cta=v.get("cta"),
                hashtags=v.get("hashtags"),
            )
            for v in raw_variants
        ]

    # 인사이트를 프롬프트용 텍스트로 변환
    @staticmethod
    def _format_insights(insights: PlaceInsightContext) -> str:
        lines = []
        if insights.keywords:
            lines.append(f"핵심 키워드: {', '.join(insights.keywords)}")
        if insights.features:
            lines.append(f"특장점: {'; '.join(insights.features)}")
        if insights.benefits:
            lines.append(f"고객 이점: {'; '.join(insights.benefits)}")
        if insights.proofs:
            lines.append(f"신뢰 증거: {'; '.join(insights.proofs)}")
        if insights.pain_points:
            lines.append(f"고객 불만: {'; '.join(insights.pain_points)}")
        return "\n".join(lines)
