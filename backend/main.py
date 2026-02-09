from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional, Dict
import re

app = FastAPI()

class ScoreRequest(BaseModel):
    reviews: List[str]                 # OCR로 뽑힌 리뷰 텍스트들
    ratings: Optional[List[float]] = None  # 있으면 사용 (없어도 동작)

class ScoreResponse(BaseModel):
    score: int
    breakdown: Dict[str, int]
    reasons: List[str]
    risks: List[str]

# --- 룰 기반 키워드(초기 MVP용) ---
POS_WORDS = [
    "맛있", "존맛", "최고", "대박", "만족", "추천", "친절", "깔끔", "재방문", "또 올", "인생", "감동",
    "분위기", "가성비", "푸짐", "퀄리티", "정성", "빠르", "편하"
]
SHARE_WORDS = [
    "사진", "비주얼", "플레이팅", "인스타", "감성", "포토", "예쁘", "존예", "영상", "후기", "공유"
]
RISK_WORDS = {
    "위생": ["위생", "벌레", "더럽", "머리카락", "냄새", "곰팡", "불결"],
    "서비스": ["불친절", "응대", "태도", "무시", "기분", "싸우", "불쾌"],
    "가격": ["비싸", "창렬", "돈 아깝", "양 적", "가격", "바가지"],
    "대기": ["웨이팅", "기다리", "줄", "오래", "혼잡", "예약 힘듦"],
    "주차": ["주차", "자리 없", "불편", "멀다"]
}

def _count_hits(text: str, words: List[str]) -> int:
    t = text.lower()
    return sum(1 for w in words if w in t)

def _risk_hits(text: str) -> Dict[str, int]:
    t = text.lower()
    out = {k: 0 for k in RISK_WORDS.keys()}
    for k, ws in RISK_WORDS.items():
        out[k] = sum(1 for w in ws if w in t)
    return out

def clamp(x: float, lo: float = 0, hi: float = 100) -> float:
    return max(lo, min(hi, x))

def score_engine(reviews: List[str], ratings: Optional[List[float]] = None) -> ScoreResponse:
    n = max(1, len(reviews))
    joined = " ".join(reviews)

    # 1) Sentiment (0~100) - 긍정 키워드 밀도 + 평점 보정
    pos_hits = sum(_count_hits(r, POS_WORDS) for r in reviews)
    pos_density = pos_hits / n  # 리뷰당 긍정 히트
    sentiment = clamp(55 + 12 * pos_density)  # 기본 55에서 시작

    if ratings and len(ratings) > 0:
        avg = sum(ratings) / len(ratings)
        rating_bonus = (avg - 3.8) * 15  # 3.8 기준
        sentiment = clamp(sentiment + rating_bonus)

    # 2) Shareability (0~100) - 공유/비주얼 키워드
    share_hits = sum(_count_hits(r, SHARE_WORDS) for r in reviews)
    share_density = share_hits / n
    shareability = clamp(40 + 18 * share_density)

    # 3) Growth (0~100) - 초기엔 더미로 "리뷰 수" 기반만 사용(나중에 날짜 추세로 교체)
    growth = clamp(35 + (min(n, 60) / 60) * 40)  # 리뷰 많을수록 신뢰/확장

    # 4) Risk (0~100) - 위험 키워드 가중 합산
    rh = _risk_hits(joined)
    risk_raw = (
        rh["위생"] * 18 +
        rh["서비스"] * 12 +
        rh["가격"] * 10 +
        rh["대기"] * 6 +
        rh["주차"] * 6
    )
    risk = clamp(risk_raw)  # 상한 100

    # 최종 점수
    final = clamp(0.4 * sentiment + 0.3 * shareability + 0.1 * growth - 0.2 * risk)

    # 이유/리스크 문장 생성(설명형)
    reasons = []
    if sentiment >= 75:
        reasons.append(f"만족도 신호가 강함 (Sentiment {int(sentiment)})")
    elif sentiment <= 55:
        reasons.append(f"만족도 신호가 약함 (Sentiment {int(sentiment)})")
    else:
        reasons.append(f"만족도는 보통 수준 (Sentiment {int(sentiment)})")

    if shareability >= 70:
        reasons.append(f"사진/비주얼 기반 확산 가능성 높음 (Shareability {int(shareability)})")
    else:
        reasons.append(f"확산 신호는 중간/낮음 (Shareability {int(shareability)})")

    reasons.append(f"리뷰 샘플 {n}개 기준으로 산출 (Growth {int(growth)})")

    risks = []
    # 많이 나온 리스크 2개만 노출
    top_risks = sorted(rh.items(), key=lambda x: x[1], reverse=True)
    for k, v in top_risks:
        if v > 0:
            risks.append(f"{k} 관련 불만 키워드 감지 ({v})")
        if len(risks) >= 2:
            break

    breakdown = {
        "sentiment": int(sentiment),
        "shareability": int(shareability),
        "growth": int(growth),
        "risk": int(risk),
    }

    return ScoreResponse(
        score=int(round(final)),
        breakdown=breakdown,
        reasons=reasons,
        risks=risks
    )

@app.post("/api/insight/score", response_model=ScoreResponse)
def insight_score(req: ScoreRequest):
    return score_engine(req.reviews, req.ratings)
