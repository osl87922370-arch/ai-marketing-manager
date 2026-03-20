import re
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from core.db import get_db
from core.plan_gate import require_pro
from models.generation import Generation

router = APIRouter(tags=["pro"])


@router.get("/utm/list")
def list_utm_links(
    db: Session = Depends(get_db),
    current_user=Depends(require_pro),
):
    """프로 사용자의 UTM 태그가 포함된 생성 목록을 반환합니다."""
    generations = (
        db.query(Generation)
        .filter(Generation.user_id == str(current_user.id))
        .order_by(Generation.created_at.desc())
        .limit(50)
        .all()
    )

    results = []
    url_pattern = re.compile(r'https?://[^\s<>"\']+utm_')

    for gen in generations:
        output = gen.output_json or {}
        variants = output.get("variants", [])
        utm_urls = []

        for v in variants:
            body = v.get("body", "") or ""
            cta = v.get("cta", "") or ""
            for text in [body, cta]:
                urls = url_pattern.findall(text)
                utm_urls.extend(urls)

        if utm_urls:
            results.append({
                "generation_id": gen.id,
                "headline": gen.headline or (variants[0].get("headline", "") if variants else ""),
                "channel": (gen.input_json or {}).get("channel", ""),
                "created_at": gen.created_at.isoformat() if gen.created_at else None,
                "utm_urls": utm_urls,
            })

    return {"ok": True, "data": results}
