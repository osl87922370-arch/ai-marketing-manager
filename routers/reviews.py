import base64
import json
import os
from typing import List, Optional

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from openai import OpenAI
from pydantic import BaseModel
from sqlalchemy.orm import Session

from core.db import get_db
from core.security import get_current_user
from models.review_analysis import ReviewAnalysis
from utils.excel_place_reviews import load_reviews_from_excel


class ReviewAnalysisOut(BaseModel):
    id: str
    filename: Optional[str] = None
    total: Optional[int] = None
    ok: Optional[int] = None
    fail: Optional[int] = None
    positive_keywords: Optional[List[str]] = None
    negative_keywords: Optional[List[str]] = None
    target_suggestion: Optional[str] = None
    tone_suggestion: Optional[str] = None
    strength: Optional[str] = None
    weakness: Optional[str] = None
    copy_hint: Optional[str] = None
    created_at: str

router = APIRouter(prefix="/reviews", tags=["reviews"])

FAIL_RATIO_THRESHOLD = 0.30
ERROR_SAMPLE_LIMIT = 20
ANALYZE_REVIEW_LIMIT = 30  # GPT에 보낼 최대 리뷰 수

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


@router.delete("/history/{analysis_id}", status_code=204)
def delete_review_analysis(
    analysis_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    row = (
        db.query(ReviewAnalysis)
        .filter(
            ReviewAnalysis.id == analysis_id,
            ReviewAnalysis.user_id == str(current_user.id),
        )
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="분석 기록을 찾을 수 없습니다.")
    db.delete(row)
    db.commit()


@router.get("/history", response_model=List[ReviewAnalysisOut])
def list_review_history(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    rows = (
        db.query(ReviewAnalysis)
        .filter(ReviewAnalysis.user_id == str(current_user.id))
        .order_by(ReviewAnalysis.created_at.desc())
        .limit(50)
        .all()
    )
    return [
        ReviewAnalysisOut(
            id=str(r.id),
            filename=r.filename,
            total=r.total,
            ok=r.ok,
            fail=r.fail,
            positive_keywords=r.positive_keywords,
            negative_keywords=r.negative_keywords,
            target_suggestion=r.target_suggestion,
            tone_suggestion=r.tone_suggestion,
            strength=r.strength,
            weakness=r.weakness,
            copy_hint=r.copy_hint,
            created_at=r.created_at.isoformat() if r.created_at else "",
        )
        for r in rows
    ]


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


ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_IMAGES = 50
BATCH_SIZE = 10


def _batch_prompt(batch_num: int, total_batches: int):
    return {
        "type": "text",
        "text": f"""다음은 고객이 리뷰에 올린 이미지들입니다 (배치 {batch_num}/{total_batches}).
마케팅 관점에서 각 이미지를 분석해주세요.

각 이미지에서 파악할 것:
1. 무엇이 촬영되었는지 (메뉴, 제품, 인테리어, 서비스 등)
2. 고객이 왜 이 사진을 찍었는지 (만족 포인트)

아래 JSON 형식으로만 응답:
{{
  "image_descriptions": ["이미지1 설명", "이미지2 설명", ...],
  "popular_items": ["인기 항목1", "항목2", ...],
  "visual_preferences": ["시각적 선호1", "선호2", ...],
  "positive_keywords": ["긍정 키워드1", "키워드2", ...],
  "negative_keywords": ["개선점1", ...]
}}""",
    }


def _synthesis_prompt(batch_results: list, total_images: int):
    return f"""다음은 고객 리뷰 이미지 {total_images}장을 배치별로 분석한 결과입니다.
전체를 종합하여 최종 마케팅 인사이트를 작성해주세요.

배치별 분석 결과:
{json.dumps(batch_results, ensure_ascii=False)}

아래 JSON 형식으로만 응답:
{{
  "popular_items": ["인기 항목1", "인기 항목2", ...],
  "visual_preferences": ["고객 시각적 선호1", "선호2", ...],
  "positive_keywords": ["긍정 키워드1", "키워드2", "키워드3", "키워드4", "키워드5"],
  "negative_keywords": ["개선점1", "개선점2", "개선점3"],
  "target_suggestion": "추천 타겟 고객층",
  "tone_suggestion": "친근|전문|유머|하드셀 중 하나",
  "strength": "핵심 강점 한 줄 요약",
  "weakness": "시각적으로 보이는 약점 한 줄 (없으면 '특이사항 없음')",
  "copy_hint": "카피 작성 시 강조할 포인트 한 줄",
  "image_summary": "전체 이미지에서 파악한 고객 선호도 종합 요약 (2~3문장)"
}}"""


@router.post("/analyze-images")
async def analyze_images(
    files: List[UploadFile] = File(...),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """고객 리뷰 이미지 → GPT-4o Vision 배치 분석 → 종합 인사이트"""
    if not files:
        raise HTTPException(status_code=400, detail="이미지를 1개 이상 업로드해주세요.")
    if len(files) > MAX_IMAGES:
        raise HTTPException(status_code=400, detail=f"최대 {MAX_IMAGES}장까지 업로드 가능합니다.")

    # 이미지 읽기 및 검증
    image_data = []
    for f in files:
        if f.content_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"지원하지 않는 형식: {f.filename}. jpg, png, webp, gif만 가능합니다.",
            )
        data = await f.read()
        b64 = base64.b64encode(data).decode("utf-8")
        image_data.append({"b64": b64, "ct": f.content_type})

    # 배치 분할
    batches = [image_data[i:i + BATCH_SIZE] for i in range(0, len(image_data), BATCH_SIZE)]
    batch_results = []
    all_descriptions = []
    fail_count = 0

    for idx, batch in enumerate(batches):
        imgs = [
            {"type": "image_url", "image_url": {"url": f"data:{img['ct']};base64,{img['b64']}", "detail": "low"}}
            for img in batch
        ]
        try:
            resp = client.chat.completions.create(
                model="gpt-4o",
                messages=[{"role": "user", "content": [_batch_prompt(idx + 1, len(batches))] + imgs}],
                response_format={"type": "json_object"},
                temperature=0.3,
                max_tokens=1500,
            )
            result = json.loads(resp.choices[0].message.content)
            batch_results.append(result)
            all_descriptions.extend(result.get("image_descriptions", []))
        except Exception:
            fail_count += len(batch)

    if not batch_results:
        raise HTTPException(status_code=502, detail="이미지 분석에 실패했습니다.")

    # 종합 분석
    try:
        synth = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": _synthesis_prompt(batch_results, len(files))}],
            response_format={"type": "json_object"},
            temperature=0.3,
            max_tokens=1500,
        )
        analysis = json.loads(synth.choices[0].message.content)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"종합 분석 실패: {str(e)}")

    analysis["image_descriptions"] = all_descriptions
    ok_count = len(files) - fail_count

    db_record = ReviewAnalysis(
        user_id=str(current_user.id),
        filename=f"이미지 {len(files)}장",
        total=len(files),
        ok=ok_count,
        fail=fail_count,
        positive_keywords=analysis.get("positive_keywords"),
        negative_keywords=analysis.get("negative_keywords"),
        target_suggestion=analysis.get("target_suggestion"),
        tone_suggestion=analysis.get("tone_suggestion"),
        strength=analysis.get("strength"),
        weakness=analysis.get("weakness"),
        copy_hint=analysis.get("copy_hint"),
        source_type="image",
        image_insights={
            "image_descriptions": all_descriptions,
            "popular_items": analysis.get("popular_items", []),
            "visual_preferences": analysis.get("visual_preferences", []),
            "image_summary": analysis.get("image_summary", ""),
        },
    )
    db.add(db_record)
    db.commit()

    return {
        "id": db_record.id,
        "meta": {"total": len(files), "ok": ok_count, "fail": fail_count},
        "analysis": analysis,
    }
