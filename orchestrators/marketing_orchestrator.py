from __future__ import annotations

import time
from typing import Literal

from fastapi import HTTPException
from sqlalchemy.orm import Session

from agents.ads_agent import AdsAgent
from agents.base import BaseAgent
from agents.blog_agent import BlogAgent
from agents.sns_agent import SNSAgent
from models.workflow_run import WorkflowRun
from repositories.review_repository import get_reviews, save_insights
from schemas.workflow import RunResponse
from services.insight_service import extract_insights

_AGENTS: dict[str, BaseAgent] = {
    "sns": SNSAgent(),
    "blog": BlogAgent(),
    "ads": AdsAgent(),
}


def run_pipeline(
    db: Session,
    dataset_id: str,
    user_id: str,
    channel: Literal["sns", "blog", "ads"],
    variant_count: int,
) -> RunResponse:
    t0 = time.time()

    # 1. DB에서 리뷰 불러오기
    reviews = get_reviews(db, dataset_id, limit=50)
    if not reviews:
        raise HTTPException(status_code=400, detail="해당 데이터셋에 리뷰가 없습니다.")

    # 2. GPT-4o로 인사이트 추출
    insights = extract_insights(reviews, dataset_id)

    # 3. 인사이트 DB 저장
    save_insights(db, dataset_id, insights.model_dump())

    # 4. 채널별 에이전트 선택
    agent = _AGENTS.get(channel)
    if not agent:
        raise HTTPException(status_code=400, detail=f"지원하지 않는 채널: {channel}")

    # 5. 카피 생성
    variants = agent.generate(insights, variant_count)

    latency_ms = int((time.time() - t0) * 1000)

    # 6. WorkflowRun 저장
    run = WorkflowRun(
        dataset_id=dataset_id,
        user_id=user_id,
        channel=channel,
        status="succeeded",
        result_json={
            "insights": insights.model_dump(),
            "variants": [v.model_dump() for v in variants],
        },
        latency_ms=latency_ms,
    )
    db.add(run)
    db.commit()
    db.refresh(run)

    return RunResponse(
        run_id=str(run.id),
        dataset_id=dataset_id,
        channel=channel,
        insights=insights,
        variants=variants,
        latency_ms=latency_ms,
    )
