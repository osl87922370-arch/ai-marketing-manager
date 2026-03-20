import csv
import io
import uuid
from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy import func
from sqlalchemy.orm import Session

from core.db import get_db
from core.plan_gate import require_pro
from models.campaign_metric import CampaignMetric

router = APIRouter(tags=["pro"])


@router.get("/ga/summary")
def ga_summary(
    db: Session = Depends(get_db),
    current_user=Depends(require_pro),
):
    """캠페인 성과 요약 지표를 반환합니다."""
    user_id = str(current_user.id)

    row = (
        db.query(
            func.sum(CampaignMetric.impressions).label("impressions"),
            func.sum(CampaignMetric.clicks).label("clicks"),
            func.sum(CampaignMetric.conversions).label("conversions"),
            func.sum(CampaignMetric.cost).label("cost"),
            func.sum(CampaignMetric.revenue).label("revenue"),
        )
        .filter(CampaignMetric.user_id == user_id)
        .first()
    )

    impressions = row.impressions or 0
    clicks = row.clicks or 0
    conversions = row.conversions or 0
    cost = row.cost or 0.0
    revenue = row.revenue or 0.0
    ctr = round(clicks / impressions * 100, 2) if impressions > 0 else 0
    roas = round(revenue / cost, 2) if cost > 0 else 0

    return {
        "ok": True,
        "data": {
            "impressions": impressions,
            "clicks": clicks,
            "conversions": conversions,
            "cost": round(cost),
            "revenue": round(revenue),
            "ctr": ctr,
            "roas": roas,
        },
    }


@router.get("/ga/trend")
def ga_trend(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user=Depends(require_pro),
):
    """일별 성과 트렌드를 반환합니다."""
    user_id = str(current_user.id)
    start_date = date.today() - timedelta(days=days)

    rows = (
        db.query(
            CampaignMetric.date,
            func.sum(CampaignMetric.impressions).label("impressions"),
            func.sum(CampaignMetric.clicks).label("clicks"),
            func.sum(CampaignMetric.conversions).label("conversions"),
        )
        .filter(CampaignMetric.user_id == user_id, CampaignMetric.date >= start_date)
        .group_by(CampaignMetric.date)
        .order_by(CampaignMetric.date)
        .all()
    )

    trend = [
        {
            "date": row.date.isoformat(),
            "impressions": row.impressions or 0,
            "clicks": row.clicks or 0,
            "conversions": row.conversions or 0,
        }
        for row in rows
    ]

    return {"ok": True, "data": trend}


@router.post("/ga/import")
async def ga_import(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(require_pro),
):
    """CSV 파일로 캠페인 지표를 가져옵니다.

    CSV 형식: date,campaign_name,impressions,clicks,conversions,cost,revenue
    """
    user_id = str(current_user.id)
    content = await file.read()
    text = content.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(text))

    imported = 0
    for row in reader:
        try:
            metric = CampaignMetric(
                id=str(uuid.uuid4()),
                user_id=user_id,
                generation_id=row.get("generation_id", None),
                campaign_name=row.get("campaign_name", ""),
                date=datetime.strptime(row["date"], "%Y-%m-%d").date(),
                impressions=int(row.get("impressions", 0)),
                clicks=int(row.get("clicks", 0)),
                conversions=int(row.get("conversions", 0)),
                cost=float(row.get("cost", 0)),
                revenue=float(row.get("revenue", 0)),
            )
            db.add(metric)
            imported += 1
        except (KeyError, ValueError):
            continue

    db.commit()
    return {"ok": True, "imported": imported}


@router.post("/ga/sync-meta")
def sync_meta(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user=Depends(require_pro),
):
    """Meta Ads API에서 광고 성과 데이터를 자동으로 가져옵니다."""
    from services.meta_ads import sync_meta_to_db

    try:
        imported = sync_meta_to_db(db, str(current_user.id), days=days)
        return {"ok": True, "imported": imported, "source": "meta_ads"}
    except ValueError as e:
        return {"ok": False, "error": str(e)}
