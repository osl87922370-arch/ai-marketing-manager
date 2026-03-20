import re
from urllib.parse import urlencode, urlparse, parse_qs, urlunparse


def append_utm(url: str, utm_params: dict) -> str:
    """URL에 UTM 파라미터를 추가합니다."""
    parsed = urlparse(url)
    existing_params = parse_qs(parsed.query)
    # 기존 UTM 파라미터가 없는 경우에만 추가
    for key, value in utm_params.items():
        if key not in existing_params:
            existing_params[key] = [value]
    new_query = urlencode({k: v[0] for k, v in existing_params.items()})
    return urlunparse(parsed._replace(query=new_query))


def apply_utm_to_text(text: str, utm_params: dict) -> str:
    """텍스트 내 모든 URL에 UTM 파라미터를 추가합니다."""
    url_pattern = r'(https?://[^\s<>"\']+)'

    def replace_url(match):
        return append_utm(match.group(0), utm_params)

    return re.sub(url_pattern, replace_url, text)


def build_utm_params(
    channel: str,
    product_name: str = "",
    generation_id: str = "",
) -> dict:
    """채널/상품/생성ID 기반으로 UTM 파라미터를 생성합니다."""
    return {
        "utm_source": channel or "direct",
        "utm_medium": "copy",
        "utm_campaign": product_name.replace(" ", "_")[:50] if product_name else "insightflow",
        "utm_content": generation_id[:12] if generation_id else "",
    }
