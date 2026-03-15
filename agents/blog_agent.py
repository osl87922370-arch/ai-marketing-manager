from __future__ import annotations

from schemas.place_insights import PlaceInsightContext
from agents.base import BaseAgent


class BlogAgent(BaseAgent):
    """블로그 콘텐츠 에이전트 — 서론/본론/결론 구조, SEO 최적화."""

    channel = "blog"

    def _build_prompt(self, insights: PlaceInsightContext, variant_count: int) -> str:
        insight_text = self._format_insights(insights)
        return f"""아래 고객 리뷰 인사이트를 바탕으로 블로그 마케팅 콘텐츠를 {variant_count}가지 작성해주세요.

[인사이트]
{insight_text}

[작성 규칙]
- 헤드라인: 30자 이내, 궁금증을 유발하는 SEO 제목
- 본문: 200-300자, 서론(공감) → 본론(특장점/증거) → 결론(행동 유도) 구조
- CTA: 15자 이내, 구독·공유·방문 유도
- 해시태그: null (블로그는 해시태그 없음)
- 각 버전은 다른 접근 방식(정보형/스토리형/비교형) 사용

반드시 아래 JSON 형식으로만 응답하세요:
{{
  "variants": [
    {{
      "headline": "제목",
      "body": "본문",
      "cta": "행동 유도 문구",
      "hashtags": null
    }}
  ]
}}"""
