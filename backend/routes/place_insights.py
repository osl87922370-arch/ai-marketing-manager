
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import uuid
import os
from datetime import datetime

from db import get_db
from model.place_insights import ReviewDataset, ReviewRow
from schemas.place_insights import ReviewDatasetCreate
from utils.excel_place_reviews import load_reviews_from_excel

router = APIRouter(
    prefix="/place-insights",
    tags=["place-insights"]
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload")
def upload_place_reviews(
    file: UploadFile = File(...),
    dataset_name: str = "네이버 플레이스 리뷰",
    db: Session = Depends(get_db)
):
    """
    엑셀 업로드 → 즉시 분석 → DB 저장 (동기 처리)
    """

    # 1️⃣ 파일 저장
    file_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_DIR, f"{file_id}_{file.filename}")

    with open(file_path, "wb") as buffer:
        buffer.write(file.file.read())

    # 2️⃣ 엑셀 파싱
    with open(file_path, "rb") as f:
     reviews = load_reviews_from_excel(
        f,
        default_year=datetime.now().year
    )
    
    
    
    

    # 3️⃣ Dataset 생성
    dataset = ReviewDataset(
        dataset_name=dataset_name,
        source_type="excel"
    )
    db.add(dataset)
    db.commit()
    db.refresh(dataset)

    # 4️⃣ ReviewRow bulk insert
    
    


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

            meta=r.meta
        )
        for r in rows
    ]

    db.bulk_save_objects(review_objects)
    db.commit()

    return {
        "dataset_id": dataset.id,
        "rows_saved": len(review_objects),

    }