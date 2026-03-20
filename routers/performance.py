from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from core.db import get_db
from core.plan_gate import require_pro
from models.campaign_metric import CampaignMetric
from models.generation import Generation

router = APIRouter(tags=["pro"])


@router.get("/performance/compare")
def compare_performance(
    db: Session = Depends(get_db),
    current_user=Depends(require_pro),
):
    """카피(생성)별 성과를 비교합니다."""
    user_id = str(current_user.id)

    # 캠페인 지표가 연결된 생성 목록
    rows = (
        db.query(
            CampaignMetric.generation_id,
            func.sum(CampaignMetric.impressions).label("impressions"),
            func.sum(CampaignMetric.clicks).label("clicks"),
            func.sum(CampaignMetric.conversions).label("conversions"),
            func.sum(CampaignMetric.cost).label("cost"),
            func.sum(CampaignMetric.revenue).label("revenue"),
        )
        .filter(
            CampaignMetric.user_id == user_id,
            CampaignMetric.generation_id.isnot(None),
        )
        .group_by(CampaignMetric.generation_id)
        .all()
    )

    results = []
    for row in rows:
        gen = db.query(Generation).filter(Generation.id == row.generation_id).first()
        headline = ""
        channel = ""
        if gen:
            headline = gen.headline or ""
            channel = (gen.input_json or {}).get("channel", "")

        impressions = row.impressions or 0
        clicks = row.clicks or 0
        ctr = round(clicks / impressions * 100, 2) if impressions > 0 else 0

        results.append({
            "generation_id": row.generation_id,
            "headline": headline,
            "channel": channel,
            "impressions": impressions,
            "clicks": clicks,
            "ctr": ctr,
            "conversions": row.conversions or 0,
            "cost": round(row.cost or 0),
            "revenue": round(row.revenue or 0),
        })

    # CTR 기준 내림차순 정렬
    results.sort(key=lambda x: x["ctr"], reverse=True)

    return {"ok": True, "data": results}
