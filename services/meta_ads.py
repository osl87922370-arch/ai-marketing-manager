"""Meta (Facebook) Marketing API 연동 서비스"""

import os
import uuid
from datetime import date, timedelta

import httpx
from sqlalchemy.orm import Session

from models.campaign_metric import CampaignMetric

META_API_VERSION = "v21.0"
META_BASE_URL = f"https://graph.facebook.com/{META_API_VERSION}"


def _get_credentials() -> tuple[str, str]:
    token = os.getenv("META_ACCESS_TOKEN", "")
    account_id = os.getenv("META_AD_ACCOUNT_ID", "")
    return token, account_id


def fetch_campaign_insights(
    days: int = 30,
) -> list[dict]:
    """Meta Ads API에서 캠페인 성과 데이터를 가져옵니다."""
    token, account_id = _get_credentials()
    if not token or not account_id:
        raise ValueError("META_ACCESS_TOKEN 또는 META_AD_ACCOUNT_ID가 설정되지 않았습니다.")

    since = (date.today() - timedelta(days=days)).isoformat()
    until = date.today().isoformat()

    url = f"{META_BASE_URL}/act_{account_id}/insights"
    params = {
        "access_token": token,
        "fields": "campaign_name,impressions,clicks,conversions,spend,actions",
        "time_range": f'{{"since":"{since}","until":"{until}"}}',
        "time_increment": 1,  # 일별 데이터
        "level": "campaign",
        "limit": 500,
    }

    results = []
    with httpx.Client(timeout=30) as client:
        resp = client.get(url, params=params)
        data = resp.json()

        if "error" in data:
            error_msg = data["error"].get("message", "알 수 없는 오류")
            raise ValueError(f"Meta API 오류: {error_msg}")

        for row in data.get("data", []):
            conversions = 0
            revenue = 0.0
            for action in row.get("actions", []):
                if action.get("action_type") == "purchase":
                    conversions += int(action.get("value", 0))
                if action.get("action_type") == "offsite_conversion.fb_pixel_purchase":
                    conversions += int(action.get("value", 0))

            results.append({
                "campaign_name": row.get("campaign_name", ""),
                "date": row.get("date_start", ""),
                "impressions": int(row.get("impressions", 0)),
                "clicks": int(row.get("clicks", 0)),
                "conversions": conversions,
                "cost": float(row.get("spend", 0)),
                "revenue": revenue,
            })

    return results


def sync_meta_to_db(
    db: Session,
    user_id: str,
    days: int = 30,
) -> int:
    """Meta Ads 데이터를 가져와서 DB에 저장합니다."""
    insights = fetch_campaign_insights(days=days)

    imported = 0
    for row in insights:
        try:
            row_date = date.fromisoformat(row["date"])
        except (ValueError, KeyError):
            continue

        # 중복 방지: 같은 날짜 + 캠페인명이면 업데이트
        existing = (
            db.query(CampaignMetric)
            .filter(
                CampaignMetric.user_id == user_id,
                CampaignMetric.campaign_name == row["campaign_name"],
                CampaignMetric.date == row_date,
            )
            .first()
        )

        if existing:
            existing.impressions = row["impressions"]
            existing.clicks = row["clicks"]
            existing.conversions = row["conversions"]
            existing.cost = row["cost"]
            existing.revenue = row["revenue"]
        else:
            metric = CampaignMetric(
                id=str(uuid.uuid4()),
                user_id=user_id,
                campaign_name=row["campaign_name"],
                date=row_date,
                impressions=row["impressions"],
                clicks=row["clicks"],
                conversions=row["conversions"],
                cost=row["cost"],
                revenue=row["revenue"],
            )
            db.add(metric)

        imported += 1

    db.commit()
    return imported
