import json
import os

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from openai import OpenAI
from sqlalchemy.orm import Session

from core.db import get_db
from core.security import get_current_user
from models.review_analysis import ReviewAnalysis
from utils.excel_place_reviews import load_reviews_from_excel

router = APIRouter(prefix="/reviews", tags=["reviews"])

FAIL_RATIO_THRESHOLD = 0.30
ERROR_SAMPLE_LIMIT = 20
ANALYZE_REVIEW_LIMIT = 30  # GPT에 보낼 최대 리뷰 수

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


@router.post("/upload")
async def upload_reviews(file: UploadFile = File(...)):
    filename = file.filename or ""
    if not filename.lower().endswith(".xlsx"):
        raise HTTPException(status_code=400, detail="Only .xlsx files allowed")

    file_bytes = await file.read()
    result = load_reviews_from_excel(file_bytes, filename=filename)

    meta = result.get("meta", {})
    total = int(meta.get("total", 0))
    ok = int(meta.get("ok", 0))
    fail = int(meta.get("fail", 0))
    failures = result.get("failures", [])

    response_body = {
        "total": total,
        "ok": ok,
        "fail": fail,
        "errors": failures[:ERROR_SAMPLE_LIMIT],
    }

    fail_ratio = (fail / total) if total > 0 else 0.0
    if fail_ratio >= FAIL_RATIO_THRESHOLD:
        return JSONResponse(status_code=422, content=response_body)

    return response_body


@router.post("/analyze")
async def analyze_reviews(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Excel 리뷰 업로드 → GPT-4o 감성분석 → 마케팅 인사이트 반환"""
    filename = file.filename or ""
    if not filename.lower().endswith(".xlsx"):
        raise HTTPException(status_code=400, detail="Only .xlsx files allowed")

    file_bytes = await file.read()
    result = load_reviews_from_excel(file_bytes, filename=filename)

    items = result.get("items", [])
    if not items:
        raise HTTPException(status_code=422, detail="리뷰 데이터가 없습니다. 엑셀 형식을 확인해주세요.")

    # 리뷰 텍스트 추출 (최대 ANALYZE_REVIEW_LIMIT개)
    reviews = [item["content"] for item in items[:ANALYZE_REVIEW_LIMIT]]
    review_text = "\n".join(f"- {r}" for r in reviews)

    prompt = f"""다음은 고객 리뷰 목록입니다. 마케팅 관점에서 분석해주세요.

리뷰:
{review_text}

아래 JSON 형식으로만 응답해주세요:
{{
  "positive_keywords": ["키워드1", "키워드2", "키워드3", "키워드4", "키워드5"],
  "negative_keywords": ["키워드1", "키워드2", "키워드3"],
  "target_suggestion": "추천 타겟 고객층 (예: 30대 직장인 여성)",
  "tone_suggestion": "친근|전문|유머|하드셀 중 하나",
  "strength": "핵심 강점 한 줄 요약",
  "weakness": "핵심 약점 한 줄 요약",
  "copy_hint": "카피 작성 시 강조할 포인트 한 줄"
}}"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.3,
        )
        analysis = json.loads(response.choices[0].message.content)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"GPT 분석 실패: {str(e)}")

    meta = result["meta"]
    db_record = ReviewAnalysis(
        user_id=str(current_user.id),
        filename=file.filename,
        total=meta["total"],
        ok=meta["ok"],
        fail=meta["fail"],
        positive_keywords=analysis.get("positive_keywords"),
        negative_keywords=analysis.get("negative_keywords"),
        target_suggestion=analysis.get("target_suggestion"),
        tone_suggestion=analysis.get("tone_suggestion"),
        strength=analysis.get("strength"),
        weakness=analysis.get("weakness"),
        copy_hint=analysis.get("copy_hint"),
    )
    db.add(db_record)
    db.commit()

    return {
        "id": db_record.id,
        "meta": {
            "total": meta["total"],
            "ok": meta["ok"],
            "fail": meta["fail"],
        },
        "analysis": analysis,
    }
