"use client";

import { useMemo, useState } from "react";

type ScoreBreakdown = {
    sentiment: number;
    shareability: number;
    growth: number;
    risk: number;
};

type ScoreResponse = {
    score: number;
    breakdown: ScoreBreakdown;
    reasons: string[];
    risks: string[];
};

const SAMPLE_REVIEWS = [
    "음식 진짜 맛있고 분위기 좋아요",
    "사진 찍기 좋아서 인스타에 올렸어요",
    "직원분들 친절해서 또 올 것 같아요",
    "가격도 괜찮고 양도 많아요",
];

const SAMPLE_RATINGS = [5, 5, 4.5, 5];

function clamp(n: number, min = 0, max = 100) {
    return Math.max(min, Math.min(max, n));
}

function labelByScore(score: number) {
    if (score >= 80) return { label: "상위권 후보", hint: "지금은 확장/광고를 걸어도 효율이 나올 가능성이 큽니다." };
    if (score >= 60) return { label: "성장 구간", hint: "한두 개 개선만 하면 매출 레벨업 구간입니다." };
    if (score >= 40) return { label: "개선 필요", hint: "리스크/약점을 먼저 줄이면 광고비 낭비를 막습니다." };
    return { label: "리빌드 권장", hint: "포지셔닝/가격/리뷰 구조부터 재정비하는 게 빠릅니다." };
}

function priorityFromBreakdown(b: ScoreBreakdown) {
    // 낮은 항목부터 우선순위 추천
    const items = [
        { key: "sentiment", name: "만족도", value: b.sentiment, action: "불만 키워드 기반 응대 템플릿 + 운영 개선 1개 실행" },
        { key: "shareability", name: "확산력", value: b.shareability, action: "‘사진/리뷰 이벤트’ + 대표 사진 3장 교체" },
        { key: "growth", name: "성장성", value: b.growth, action: "재방문 유도(쿠폰/스탬프) + 주력 메뉴 1개 집중" },
        { key: "risk", name: "리스크", value: 100 - b.risk, action: "가격/대기/응대 리스크 1개 제거(문구/동선/정책)" },
    ]
        .map((x) => ({ ...x, value: clamp(x.value) }))
        .sort((a, z) => a.value - z.value);

    // risk는 “낮을수록 위험” 개념이 섞일 수 있어, 여기서는 100-b.risk로 안정성으로 처리
    return items.slice(0, 3);
}

function Gauge({ value }: { value: number }) {
    const v = clamp(value);
    return (
        <div className="w-full">
            <div className="flex items-center justify-between text-xs text-zinc-500">
                <span>0</span>
                <span>100</span>
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-zinc-200 overflow-hidden">
                <div className="h-2 rounded-full bg-black" style={{ width: `${v}%` }} />
            </div>
            <div className="mt-2 text-sm font-semibold">{v}점</div>
        </div>
    );
}

function MetricBar({ name, value, note }: { name: string; value: number; note: string }) {
    const v = clamp(value);
    return (
        <div className="rounded-xl border p-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="text-sm font-semibold">{name}</div>
                    <div className="mt-1 text-xs text-zinc-500">{note}</div>
                </div>
                <div className="text-sm font-bold">{v}</div>
            </div>
            <div className="mt-3 h-2 w-full rounded-full bg-zinc-200 overflow-hidden">
                <div className="h-2 rounded-full bg-black" style={{ width: `${v}%` }} />
            </div>
        </div>
    );
}

function Skeleton() {
    return (
        <div className="rounded-2xl border p-6 animate-pulse">
            <div className="h-6 w-44 bg-zinc-200 rounded" />
            <div className="mt-4 h-10 w-full bg-zinc-200 rounded" />
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="h-28 bg-zinc-200 rounded-xl" />
                <div className="h-28 bg-zinc-200 rounded-xl" />
                <div className="h-28 bg-zinc-200 rounded-xl" />
                <div className="h-28 bg-zinc-200 rounded-xl" />
            </div>
            <div className="mt-6 h-24 bg-zinc-200 rounded-xl" />
        </div>
    );
}

export default function InsightPage() {
    const [reviewsText, setReviewsText] = useState(SAMPLE_REVIEWS.join("\n"));
    const [ratingsText, setRatingsText] = useState(SAMPLE_RATINGS.join(", "));
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ScoreResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    const parsed = useMemo(() => {
        const reviews = reviewsText
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean);

        const ratings = ratingsText
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
            .map((n) => Number(n))
            .filter((n) => !Number.isNaN(n));

        return { reviews, ratings };
    }, [reviewsText, ratingsText]);

    const run = async () => {
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const res = await fetch("/api/insight/score", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    reviews: parsed.reviews,
                    ratings: parsed.ratings.length ? parsed.ratings : undefined,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data?.detail || data?.error || `Request failed (${res.status})`);
                return;
            }

            setResult(data as ScoreResponse);
        } catch (e: any) {
            setError(e?.message ?? String(e));
        } finally {
            setLoading(false);
        }
    };

    const header = result ? labelByScore(result.score) : null;
    const priorities = result ? priorityFromBreakdown(result.breakdown) : [];

    return (
        <div className="p-8">
            <div className="max-w-5xl">
                <div className="flex items-end justify-between gap-4 flex-wrap">
                    <div>
                        <div className="text-xs text-zinc-500">Insight Engine</div>
                        <h1 className="text-3xl font-bold tracking-tight">Marketing Insight Report</h1>
                        <p className="mt-2 text-sm text-zinc-600">
                            리뷰/평점을 넣고 “점수 분석 실행”을 누르면, 바로 리포트 형태로 결과가 나옵니다.
                        </p>
                    </div>

                    <button
                        onClick={run}
                        disabled={loading || parsed.reviews.length === 0}
                        className="rounded-lg bg-black px-5 py-3 text-white text-sm font-semibold disabled:opacity-50"
                    >
                        {loading ? "분석 중..." : "점수 분석 실행"}
                    </button>
                </div>

                {/* 입력 영역 */}
                <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="rounded-2xl border p-5">
                        <div className="text-sm font-semibold">리뷰 (줄바꿈 = 1개 리뷰)</div>
                        <textarea
                            value={reviewsText}
                            onChange={(e) => setReviewsText(e.target.value)}
                            rows={8}
                            className="mt-3 w-full rounded-xl border px-3 py-2 text-sm outline-none"
                            placeholder="리뷰를 한 줄에 하나씩 붙여넣어 주세요"
                        />
                        <div className="mt-2 text-xs text-zinc-500">현재 {parsed.reviews.length}개 리뷰</div>
                    </div>

                    <div className="rounded-2xl border p-5">
                        <div className="text-sm font-semibold">평점 (쉼표로 구분)</div>
                        <input
                            value={ratingsText}
                            onChange={(e) => setRatingsText(e.target.value)}
                            className="mt-3 w-full rounded-xl border px-3 py-2 text-sm outline-none"
                            placeholder="예: 5, 4.5, 5"
                        />
                        <div className="mt-4 rounded-xl bg-zinc-50 border p-4">
                            <div className="text-xs font-semibold">MVP 사용 팁</div>
                            <ul className="mt-2 text-xs text-zinc-600 list-disc pl-5 space-y-1">
                                <li>리뷰 10개 이상 넣으면 성장성/리스크가 더 안정적으로 나옵니다.</li>
                                <li>평점이 없으면 리뷰 텍스트 기반으로만 계산합니다.</li>
                                <li>실전 SaaS에서는 “업장 저장 + 히스토리 비교”가 유료 전환 포인트입니다.</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* 에러 */}
                {error && (
                    <div className="mt-6 rounded-2xl border border-zinc-300 bg-zinc-50 p-5">
                        <div className="text-sm font-semibold">에러</div>
                        <div className="mt-2 text-sm text-zinc-700 break-words">{error}</div>
                        <div className="mt-3 text-xs text-zinc-500">
                            체크: (1) 백엔드 uvicorn 실행 중인지 (2) 프론트에서 /api/insight/score 응답이 오는지 (3) route.ts BACKEND_URL 포트가 맞는지
                        </div>
                    </div>
                )}

                {/* 결과 */}
                <div className="mt-6">
                    {loading && <Skeleton />}

                    {result && (
                        <div className="rounded-2xl border p-6">
                            <div className="flex items-start justify-between gap-6 flex-wrap">
                                <div className="min-w-[260px]">
                                    <div className="text-sm font-semibold">총점</div>
                                    <div className="mt-2 text-4xl font-extrabold tracking-tight">
                                        {clamp(result.score)}점
                                    </div>
                                    <div className="mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-semibold">
                                        {header?.label}
                                    </div>
                                    <div className="mt-2 text-sm text-zinc-600">{header?.hint}</div>
                                </div>

                                <div className="flex-1 min-w-[280px]">
                                    <div className="text-sm font-semibold">점수 게이지</div>
                                    <div className="mt-3">
                                        <Gauge value={result.score} />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <MetricBar
                                    name="만족도 (Sentiment)"
                                    value={result.breakdown.sentiment}
                                    note="리뷰 톤/칭찬/불만 신호"
                                />
                                <MetricBar
                                    name="확산력 (Shareability)"
                                    value={result.breakdown.shareability}
                                    note="사진/후기 유도 가능성, 콘텐츠화 난이도"
                                />
                                <MetricBar
                                    name="성장성 (Growth)"
                                    value={result.breakdown.growth}
                                    note="리뷰 수/추세 기반의 성장 잠재력"
                                />
                                <MetricBar
                                    name="리스크 (Risk)"
                                    value={result.breakdown.risk}
                                    note="가격/서비스/대기 등 불만 키워드 기반"
                                />
                            </div>

                            <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
                                <div className="rounded-2xl border p-5 lg:col-span-2">
                                    <div className="text-sm font-semibold">분석 이유</div>
                                    <ul className="mt-3 text-sm text-zinc-700 list-disc pl-5 space-y-1">
                                        {result.reasons?.map((r, i) => (
                                            <li key={i}>{r}</li>
                                        ))}
                                    </ul>

                                    <div className="mt-5 text-sm font-semibold">리스크 신호</div>
                                    <ul className="mt-3 text-sm text-zinc-700 list-disc pl-5 space-y-1">
                                        {result.risks?.length ? (
                                            result.risks.map((r, i) => <li key={i}>{r}</li>)
                                        ) : (
                                            <li>현재 샘플에서는 뚜렷한 리스크 신호가 낮습니다.</li>
                                        )}
                                    </ul>
                                </div>

                                <div className="rounded-2xl border p-5">
                                    <div className="text-sm font-semibold">이번 주 우선순위 (Action)</div>
                                    <div className="mt-2 text-xs text-zinc-500">
                                        낮은 지표부터 “매출에 직결되는 액션”으로 변환합니다.
                                    </div>

                                    <div className="mt-4 space-y-3">
                                        {priorities.map((p, idx) => (
                                            <div key={idx} className="rounded-xl bg-zinc-50 border p-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="text-sm font-semibold">{p.name}</div>
                                                    <div className="text-xs font-bold">{p.value}</div>
                                                </div>
                                                <div className="mt-2 text-sm text-zinc-700">{p.action}</div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-5 text-xs text-zinc-500">
                                        Tip: 이 “Action 박스”가 유료 전환 포인트입니다. (다음 단계에서 자동 생성/저장/재실행)
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 rounded-2xl border bg-zinc-50 p-5">
                                <div className="text-sm font-semibold">SaaS화 체크</div>
                                <div className="mt-2 text-sm text-zinc-700">
                                    다음 단계에서 <b>업장 저장</b> + <b>히스토리 비교</b> + <b>PDF 내보내기</b>를 붙이면 “결과를 증빙할 수 있는 도구”가 되어 유료로 바뀝니다.
                                </div>
                            </div>
                        </div>
                    )}

                    {!loading && !result && !error && (
                        <div className="mt-6 rounded-2xl border p-6 text-sm text-zinc-600">
                            아직 실행 전입니다. 위 입력칸 그대로 두고 <b>점수 분석 실행</b>을 눌러보세요.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
