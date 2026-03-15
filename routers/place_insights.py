from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session
from datetime import datetime

from core.db import get_db
from core.security import get_current_user
from models.place_insights import ReviewDataset, ReviewRow
from orchestrators.marketing_orchestrator import run_pipeline
from schemas.workflow import RunRequest, RunResponse
from utils.excel_place_reviews import load_reviews_from_excel

router = APIRouter(
    prefix="/place-insights",
    tags=["place-insights"],
)


@router.post("/upload")
async def upload_reviews(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    import uuid as _uuid
    from datetime import date as _date

    if not (file.filename or "").lower().endswith(".xlsx"):
        raise HTTPException(status_code=400, detail="Excel (.xlsx) 파일만 업로드 가능합니다.")

    file_bytes = await file.read()
    result = load_reviews_from_excel(file_bytes, filename=file.filename)

    items = result.get("items", [])
    if not items:
        fail_count = result.get("meta", {}).get("fail", 0)
        raise HTTPException(
            status_code=400,
            detail=f"유효한 리뷰가 없습니다. (실패: {fail_count}건)",
        )

    dataset = ReviewDataset(
        id=str(_uuid.uuid4()),
        dataset_name=file.filename or "unknown.xlsx",
        default_year=datetime.now().year,
    )
    db.add(dataset)
    db.flush()

    today = _date.today()
    review_objects = [
        ReviewRow(
            id=str(_uuid.uuid4()),
            dataset_id=dataset.id,
            nickname=None,
            review_text=item["content"],
            review_date=(
                _date.fromisoformat(item["reviewed_at"])
                if item.get("reviewed_at")
                else today
            ),
            visit_count=None,
            meta={
                "rating": item.get("rating"),
                "platform": item.get("platform"),
                "external_id": item.get("external_id"),
                "row": item.get("row"),
            },
        )
        for item in items
    ]

    db.bulk_save_objects(review_objects)
    db.commit()

    return {
        "dataset_id": dataset.id,
        "rows_saved": len(review_objects),
        "rows_failed": result.get("meta", {}).get("fail", 0),
    }


@router.post("/{dataset_id}/run", response_model=RunResponse)
def run(
    dataset_id: str,
    body: RunRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """리뷰 인사이트 추출 → 채널별 카피 생성 파이프라인 단일 실행."""
    return run_pipeline(
        db=db,
        dataset_id=dataset_id,
        user_id=str(current_user.id),
        channel=body.channel,
        variant_count=body.variant_count,
    )
