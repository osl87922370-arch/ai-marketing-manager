"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, Loader2, FileSpreadsheet } from "lucide-react";

type Analysis = {
    positive_keywords: string[];
    negative_keywords: string[];
    target_suggestion: string;
    tone_suggestion: string;
    strength: string;
    weakness: string;
    copy_hint: string;
};

type AnalyzeResult = {
    meta: { total: number; ok: number; fail: number };
    analysis: Analysis;
};

export default function UploadPage() {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<AnalyzeResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) {
            setFile(f);
            setResult(null);
            setError(null);
        }
    };

    const handleAnalyze = async () => {
        if (!file) return;
        setLoading(true);
        setError(null);
        setResult(null);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/reviews/analyze`, {
                method: "POST",
                body: formData,
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || "분석 실패");
            }
            const data = await res.json();
            setResult(data);
        } catch (e: any) {
            setError(e.message || "분석 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateCopy = () => {
        if (!result) return;
        const a = result.analysis;
        const params = new URLSearchParams({
            target: a.target_suggestion,
            tone: a.tone_suggestion,
            hint: a.copy_hint,
            keywords: a.positive_keywords.join(", "),
        });
        router.push(`/generate?${params.toString()}`);
    };

    return (
        <div style={{ padding: 40, maxWidth: 800 }}>
            <h1 style={{ marginBottom: 4 }}>리뷰 분석</h1>
            <p style={{ color: "#888", marginBottom: 32 }}>
                고객 리뷰 엑셀 파일을 업로드하면 AI가 마케팅 인사이트를 추출합니다.
            </p>

            {/* 파일 업로드 영역 */}
            {!result && (
                <div
                    style={{
                        border: "2px dashed #ddd",
                        borderRadius: 12,
                        padding: 40,
                        textAlign: "center",
                        background: file ? "#f0f9ff" : "#fafafa",
                        position: "relative",
                        cursor: "pointer",
                    }}
                >
                    <input
                        type="file"
                        accept=".xlsx"
                        onChange={handleFileChange}
                        style={{
                            position: "absolute",
                            inset: 0,
                            opacity: 0,
                            cursor: "pointer",
                        }}
                    />
                    {file ? (
                        <>
                            <FileSpreadsheet size={40} color="#1a6fa8" style={{ marginBottom: 8 }} />
                            <div style={{ fontWeight: 600, fontSize: 16 }}>{file.name}</div>
                            <div style={{ color: "#888", fontSize: 14, marginTop: 4 }}>
                                {(file.size / 1024).toFixed(1)} KB
                            </div>
                        </>
                    ) : (
                        <>
                            <UploadCloud size={40} color="#aaa" style={{ marginBottom: 8 }} />
                            <div style={{ fontSize: 16, color: "#555" }}>
                                클릭하여 엑셀 파일 업로드
                            </div>
                            <div style={{ fontSize: 13, color: "#aaa", marginTop: 4 }}>
                                .xlsx 형식 | 필수 컬럼: content (또는 리뷰내용)
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* 엑셀 컬럼 안내 */}
            {!result && (
                <div style={{ marginTop: 16, fontSize: 13, color: "#888" }}>
                    <strong>엑셀 컬럼 안내:</strong> content(필수), rating(선택), date(선택), platform(선택)
                </div>
            )}

            {/* 분석 버튼 */}
            {file && !result && !loading && (
                <button
                    onClick={handleAnalyze}
                    style={{
                        marginTop: 24,
                        width: "100%",
                        padding: "14px",
                        background: "#1a6fa8",
                        color: "#fff",
                        border: "none",
                        borderRadius: 8,
                        fontSize: 16,
                        fontWeight: 600,
                        cursor: "pointer",
                    }}
                >
                    AI 분석 시작
                </button>
            )}

            {/* 로딩 */}
            {loading && (
                <div style={{ marginTop: 40, textAlign: "center", color: "#888" }}>
                    <Loader2 size={40} color="#1a6fa8" style={{ marginBottom: 8, animation: "spin 1s linear infinite" }} />
                    <div>리뷰를 분석하고 있습니다...</div>
                    <div style={{ fontSize: 13, marginTop: 4 }}>GPT-4o가 감성 분석 중</div>
                </div>
            )}

            {/* 에러 */}
            {error && (
                <div style={{ marginTop: 16, color: "red", fontSize: 14 }}>{error}</div>
            )}

            {/* 분석 결과 */}
            {result && (
                <div style={{ marginTop: 8 }}>
                    {/* 메타 */}
                    <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
                        <div style={{ background: "#f0f9ff", borderRadius: 8, padding: "12px 20px", textAlign: "center" }}>
                            <div style={{ fontSize: 24, fontWeight: 700 }}>{result.meta.total}</div>
                            <div style={{ fontSize: 12, color: "#888" }}>전체 리뷰</div>
                        </div>
                        <div style={{ background: "#f0fff0", borderRadius: 8, padding: "12px 20px", textAlign: "center" }}>
                            <div style={{ fontSize: 24, fontWeight: 700, color: "#2d7a2d" }}>{result.meta.ok}</div>
                            <div style={{ fontSize: 12, color: "#888" }}>분석 완료</div>
                        </div>
                        {result.meta.fail > 0 && (
                            <div style={{ background: "#fff0f0", borderRadius: 8, padding: "12px 20px", textAlign: "center" }}>
                                <div style={{ fontSize: 24, fontWeight: 700, color: "#c00" }}>{result.meta.fail}</div>
                                <div style={{ fontSize: 12, color: "#888" }}>오류</div>
                            </div>
                        )}
                    </div>

                    {/* 긍정/부정 키워드 */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                        <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 16 }}>
                            <div style={{ fontWeight: 600, marginBottom: 10, color: "#2d7a2d" }}>긍정 키워드</div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                {result.analysis.positive_keywords.map((k) => (
                                    <span key={k} style={{ background: "#f0fff0", border: "1px solid #b2e0b2", borderRadius: 4, padding: "2px 8px", fontSize: 13 }}>
                                        {k}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 16 }}>
                            <div style={{ fontWeight: 600, marginBottom: 10, color: "#c00" }}>개선 필요</div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                {result.analysis.negative_keywords.map((k) => (
                                    <span key={k} style={{ background: "#fff0f0", border: "1px solid #f0b2b2", borderRadius: 4, padding: "2px 8px", fontSize: 13 }}>
                                        {k}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 인사이트 */}
                    <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 16, marginBottom: 16 }}>
                        <div style={{ fontWeight: 600, marginBottom: 12 }}>마케팅 인사이트</div>
                        <div style={{ display: "grid", gap: 8 }}>
                            <div style={{ display: "flex", gap: 8 }}>
                                <span style={{ color: "#888", minWidth: 80, fontSize: 13 }}>추천 타겟</span>
                                <span style={{ fontWeight: 500 }}>{result.analysis.target_suggestion}</span>
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
                                <span style={{ color: "#888", minWidth: 80, fontSize: 13 }}>추천 톤</span>
                                <span style={{ fontWeight: 500 }}>{result.analysis.tone_suggestion}</span>
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
                                <span style={{ color: "#888", minWidth: 80, fontSize: 13 }}>핵심 강점</span>
                                <span>{result.analysis.strength}</span>
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
                                <span style={{ color: "#888", minWidth: 80, fontSize: 13 }}>개선 포인트</span>
                                <span>{result.analysis.weakness}</span>
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
                                <span style={{ color: "#888", minWidth: 80, fontSize: 13 }}>카피 힌트</span>
                                <span style={{ color: "#1a6fa8", fontWeight: 500 }}>{result.analysis.copy_hint}</span>
                            </div>
                        </div>
                    </div>

                    {/* 버튼 */}
                    <div style={{ display: "flex", gap: 12 }}>
                        <button
                            onClick={handleGenerateCopy}
                            style={{
                                flex: 1,
                                padding: "14px",
                                background: "#1a1a1a",
                                color: "#fff",
                                border: "none",
                                borderRadius: 8,
                                fontSize: 15,
                                fontWeight: 600,
                                cursor: "pointer",
                            }}
                        >
                            이 분석으로 카피 만들기 →
                        </button>
                        <button
                            onClick={() => { setResult(null); setFile(null); setError(null); }}
                            style={{
                                padding: "14px 20px",
                                background: "#fff",
                                color: "#555",
                                border: "1px solid #ddd",
                                borderRadius: 8,
                                fontSize: 15,
                                cursor: "pointer",
                            }}
                        >
                            다시 업로드
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
