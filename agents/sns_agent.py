from __future__ import annotations

from schemas.place_insights import PlaceInsightContext
from agents.base import BaseAgent


class SNSAgent(BaseAgent):
    """인스타그램 마케팅 카피 에이전트 — 짧고 감성적, 해시태그 포함."""

    channel = "sns"

    def _build_prompt(self, insights: PlaceInsightContext, variant_count: int) -> str:
        insight_text = self._format_insights(insights)
        return f"""아래 고객 리뷰 인사이트를 바탕으로 인스타그램 마케팅 카피를 {variant_count}가지 작성해주세요.

[인사이트]
{insight_text}

[작성 규칙]
- 헤드라인: 15자 이내, 감성적이고 공감을 이끄는 문구
- 본문: 50-80자, 스토리텔링 방식으로 감정에 호소
- CTA: 10자 이내, 부드러운 행동 유도 (예: "지금 방문하세요")
- 해시태그: 관련 해시태그 5개 (# 포함)
- 각 버전은 다른 감성 전략(공감/호기심/FOMO/행복/신뢰) 사용

반드시 아래 JSON 형식으로만 응답하세요:
{{
  "variants": [
    {{
      "headline": "헤드라인",
      "body": "본문",
      "cta": "행동 유도 문구",
      "hashtags": ["#태그1", "#태그2", "#태그3", "#태그4", "#태그5"]
    }}
  ]
}}"""
