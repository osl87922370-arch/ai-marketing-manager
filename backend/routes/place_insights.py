from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from ..db import get_db
from ..utils.excel_place_reviews import load_reviews_from_excel
from ..schemas.place_insights import ReviewDatasetCreate
from ..model.place_insights import ReviewDataset, ReviewRow

router = APIRouter(
    prefix="/place-insights",
    tags=["place-insights"]
)


@router.post("/upload")
def upload_reviews(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    if not file.filename.endswith(".xlsx"):
        raise HTTPException(status_code=400, detail="Excel (.xlsx) 파일만 업로드 가능합니다.")

    rows = load_reviews_from_excel(
    file.file,
    default_year=datetime.now().year
)

    if not rows:
        raise HTTPException(status_code=400, detail="엑셀에 리뷰 데이터가 없습니다.")

    dataset = ReviewDataset(
        dataset_name=file.filename,
        total_rows=len(rows),
    )

    db.add(dataset)
    db.flush()  # dataset.id 확보

    review_objects = [
        ReviewRow(
            dataset_id=dataset.id,
            nickname=r.nickname,
            review_text=r.review_text,
            review_date=r.review_date,
            visit_count=r.visit_count,
            meta=r.meta,
        )
        for r in rows
    ]

    db.bulk_save_objects(review_objects)
    db.commit()

    return {
        "dataset_id": dataset.id,
        "rows_saved": len(review_objects),
    }