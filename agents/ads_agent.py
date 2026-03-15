from __future__ import annotations

from schemas.place_insights import PlaceInsightContext
from agents.base import BaseAgent


class AdsAgent(BaseAgent):
    """광고 카피 에이전트 — 고CTR 헤드라인, 짧고 직접적인 본문."""

    channel = "ads"

    def _build_prompt(self, insights: PlaceInsightContext, variant_count: int) -> str:
        insight_text = self._format_insights(insights)
        return f"""아래 고객 리뷰 인사이트를 바탕으로 디지털 광고 카피를 {variant_count}가지 작성해주세요.

[인사이트]
{insight_text}

[작성 규칙]
- 헤드라인: 15자 이내, 클릭률 최적화 — 숫자/긴급성/혜택 강조
- 본문: 30-50자, 핵심 혜택 1-2가지만 간결하게
- CTA: 10자 이내, 직접적 행동 촉구 (예: "지금 예약", "오늘만 할인")
- 해시태그: null (광고는 해시태그 없음)
- 각 버전은 다른 광고 전략(긴급성/가성비/사회적증거/독점혜택) 사용

반드시 아래 JSON 형식으로만 응답하세요:
{{
  "variants": [
    {{
      "headline": "헤드라인",
      "body": "본문",
      "cta": "행동 유도 문구",
      "hashtags": null
    }}
  ]
}}"""
