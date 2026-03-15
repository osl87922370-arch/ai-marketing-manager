from schemas.generate import GenerateRequest

TONE_MAP = {
    "친근": "친근하고 따뜻한 말투",
    "전문": "신뢰감 있고 전문적인 말투",
    "유머": "유머러스하고 재치 있는 말투",
    "하드셀": "강렬하고 구매를 직접 촉구하는 말투",
}


def build_prompt(payload: GenerateRequest) -> str:
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
