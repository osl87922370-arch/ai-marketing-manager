"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, Loader2, FileSpreadsheet, ImageIcon, X } from "lucide-react";
import { apiFetch } from "@/lib/api";

type Analysis = {
    positive_keywords: string[];
    negative_keywords: string[];
    target_suggestion: string;
    tone_suggestion: string;
    strength: string;
    weakness: string;
    copy_hint: string;
    image_descriptions?: string[];
    popular_items?: string[];
    visual_preferences?: string[];
};

type AnalyzeResult = {
    meta: { total: number; ok: number; fail: number };
    analysis: Analysis;
};

type HistoryItem = {
    id: string;
    filename?: string;
    total?: number;
    ok?: number;
    fail?: number;
    positive_keywords?: string[];
    negative_keywords?: string[];
    target_suggestion?: string;
    tone_suggestion?: string;
    strength?: string;
    weakness?: string;
    copy_hint?: string;
    created_at: string;
};

function formatDate(value?: string) {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    return `${yyyy}.${mm}.${dd} ${hh}:${mi}`;
}

function AnalysisCard({ a, onUseCopy }: { a: Analysis; onUseCopy: () => void }) {
    return (
        <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 12 }}>
                    <div style={{ fontWeight: 600, marginBottom: 8, color: "#2d7a2d", fontSize: 13 }}>긍정 키워드</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {(a.positive_keywords || []).map((k) => (
                            <span key={k} style={{ background: "#f0fff0", border: "1px solid #b2e0b2", borderRadius: 4, padding: "2px 6px", fontSize: 12 }}>{k}</span>
                        ))}
                    </div>
                </div>
                <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 12 }}>
                    <div style={{ fontWeight: 600, marginBottom: 8, color: "#c00", fontSize: 13 }}>개선 필요</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {(a.negative_keywords || []).map((k) => (
                            <span key={k} style={{ background: "#fff0f0", border: "1px solid #f0b2b2", borderRadius: 4, padding: "2px 6px", fontSize: 12 }}>{k}</span>
                        ))}
                    </div>
                </div>
            </div>
            <div style={{ background: "#fafafa", borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 13 }}>
                <div style={{ display: "grid", gap: 6 }}>
                    {a.target_suggestion && (
                        <div style={{ display: "flex", gap: 8 }}>
                            <span style={{ color: "#888", minWidth: 72 }}>추천 타겟</span>
                            <span style={{ fontWeight: 500 }}>{a.target_suggestion}</span>
                        </div>
                    )}
                    {a.tone_suggestion && (
                        <div style={{ display: "flex", gap: 8 }}>
                            <span style={{ color: "#888", minWidth: 72 }}>추천 톤</span>
                            <span style={{ fontWeight: 500 }}>{a.tone_suggestion}</span>
                        </div>
                    )}
                    {a.strength && (
                        <div style={{ display: "flex", gap: 8 }}>
                            <span style={{ color: "#888", minWidth: 72 }}>핵심 강점</span>
                            <span>{a.strength}</span>
                        </div>
                    )}
                    {a.copy_hint && (
                        <div style={{ display: "flex", gap: 8 }}>
                            <span style={{ color: "#888", minWidth: 72 }}>카피 힌트</span>
                            <span style={{ color: "#1a6fa8", fontWeight: 500 }}>{a.copy_hint}</span>
                        </div>
                    )}
                </div>
            </div>
            <button
                onClick={onUseCopy}
                style={{
                    width: "100%",
                    padding: "12px",
                    background: "#1a1a1a",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                }}
            >
                이 분석으로 카피 만들기 →
            </button>
        </>
    );
}

export default function UploadPage() {
    const router = useRouter();
    const [tab, setTab] = useState<"upload" | "image" | "history">("upload");

    // 업로드 탭 상태
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<AnalyzeResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    // 이미지 탭 상태
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [imageLoading, setImageLoading] = useState(false);
    const [imageResult, setImageResult] = useState<AnalyzeResult | null>(null);
    const [imageError, setImageError] = useState<string | null>(null);

    // 히스토리 탭 상태
    const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        if (tab === "history") fetchHistory();
    }, [tab]);

    async function deleteHistory(id: string) {
        if (!window.confirm("삭제 후 목록에서 보이지 않습니다. 계속하시겠습니까?")) return;
        setDeletingId(id);
        try {
            await apiFetch(`/reviews/history/${id}`, { method: "DELETE" });
            setHistoryItems((prev) => prev.filter((item) => item.id !== id));
        } catch (e: any) {
            setHistoryError(e.message || "삭제에 실패했습니다.");
        } finally {
            setDeletingId(null);
        }
    }

    async function fetchHistory() {
        setHistoryLoading(true);
        setHistoryError(null);
        try {
            const data = await apiFetch<HistoryItem[]>("/reviews/history");
            setHistoryItems(data);
        } catch (e: any) {
            setHistoryError(e.message || "히스토리를 불러오지 못했습니다.");
        } finally {
            setHistoryLoading(false);
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) { setFile(f); setResult(null); setError(null); }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = Array.from(e.target.files || []).slice(0, 50);
        setImageFiles(selected);
        setImageResult(null);
        setImageError(null);
        const previews = selected.map((f) => URL.createObjectURL(f));
        setImagePreviews(previews);
    };

    const removeImage = (idx: number) => {
        setImageFiles((prev) => prev.filter((_, i) => i !== idx));
        setImagePreviews((prev) => prev.filter((_, i) => i !== idx));
    };

    const handleImageAnalyze = async () => {
        if (imageFiles.length === 0) return;
        setImageLoading(true);
        setImageError(null);
        setImageResult(null);
        const formData = new FormData();
        imageFiles.forEach((f) => formData.append("files", f));
        try {
            const data = await apiFetch<AnalyzeResult>("/reviews/analyze-images", { method: "POST", body: formData });
            setImageResult(data);
        } catch (e: any) {
            setImageError(e.message || "이미지 분석 중 오류가 발생했습니다.");
        } finally {
            setImageLoading(false);
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
            const data = await apiFetch<AnalyzeResult>("/reviews/analyze", { method: "POST", body: formData });
            setResult(data);
        } catch (e: any) {
            setError(e.message || "분석 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    function buildCopyParams(a: Analysis | HistoryItem) {
        const params = new URLSearchParams({
            target: (a as any).target_suggestion || "",
            tone: (a as any).tone_suggestion || "",
            hint: (a as any).copy_hint || "",
            keywords: ((a as any).positive_keywords || []).join(", "),
        });
        return params.toString();
    }

    const tabStyle = (active: boolean) => ({
        padding: "10px 24px",
        borderRadius: 8,
        border: active ? "2px solid #1a1a1a" : "1px solid #ddd",
        background: active ? "#1a1a1a" : "#fff",
        color: active ? "#fff" : "#555",
        fontWeight: active ? 700 : 400,
        fontSize: 14,
        cursor: "pointer",
    });

    return (
        <div style={{ padding: 40, maxWidth: 800 }}>
            <h1 style={{ marginBottom: 4 }}>리뷰 분석</h1>
            <p style={{ color: "#888", marginBottom: 24 }}>
                고객 리뷰 데이터(엑셀 또는 이미지)를 업로드하면 AI가 마케팅 인사이트를 추출합니다.
            </p>

            {/* 탭 */}
            <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
                <button style={tabStyle(tab === "upload")} onClick={() => setTab("upload")}>엑셀 분석</button>
                <button style={tabStyle(tab === "image")} onClick={() => setTab("image")}>이미지 분석</button>
                <button style={tabStyle(tab === "history")} onClick={() => setTab("history")}>분석 히스토리</button>
            </div>

            {/* ===== 업로드 탭 ===== */}
            {tab === "upload" && (
                <>
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
                                style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
                            />
                            {file ? (
                                <>
                                    <FileSpreadsheet size={40} color="#1a6fa8" style={{ marginBottom: 8 }} />
                                    <div style={{ fontWeight: 600, fontSize: 16 }}>{file.name}</div>
                                    <div style={{ color: "#888", fontSize: 14, marginTop: 4 }}>{(file.size / 1024).toFixed(1)} KB</div>
                                </>
                            ) : (
                                <>
                                    <UploadCloud size={40} color="#aaa" style={{ marginBottom: 8 }} />
                                    <div style={{ fontSize: 16, color: "#555" }}>클릭하여 엑셀 파일 업로드</div>
                                    <div style={{ fontSize: 13, color: "#aaa", marginTop: 4 }}>.xlsx 형식 | 필수 컬럼: content (또는 리뷰내용)</div>
                                </>
                            )}
                        </div>
                    )}
                    {!result && (
                        <div style={{ marginTop: 12, fontSize: 13, color: "#888" }}>
                            <strong>엑셀 컬럼 안내:</strong> content(필수), rating(선택), date(선택), platform(선택)
                        </div>
                    )}
                    {file && !result && !loading && (
                        <button
                            onClick={handleAnalyze}
                            style={{ marginTop: 20, width: "100%", padding: "14px", background: "#1a6fa8", color: "#fff", border: "none", borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: "pointer" }}
                        >
                            AI 분석 시작
                        </button>
                    )}
                    {loading && (
                        <div style={{ marginTop: 40, textAlign: "center", color: "#888" }}>
                            <Loader2 size={40} color="#1a6fa8" style={{ marginBottom: 8, animation: "spin 1s linear infinite" }} />
                            <div>리뷰를 분석하고 있습니다...</div>
                            <div style={{ fontSize: 13, marginTop: 4 }}>GPT-4o가 감성 분석 중</div>
                        </div>
                    )}
                    {error && <div style={{ marginTop: 16, color: "red", fontSize: 14 }}>{error}</div>}
                    {result && (
                        <div style={{ marginTop: 8 }}>
                            <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
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
                            <AnalysisCard
                                a={result.analysis}
                                onUseCopy={() => router.push(`/generate?${buildCopyParams(result.analysis)}`)}
                            />
                            <button
                                onClick={() => { setResult(null); setFile(null); setError(null); }}
                                style={{ marginTop: 12, width: "100%", padding: "12px", background: "#fff", color: "#555", border: "1px solid #ddd", borderRadius: 8, fontSize: 14, cursor: "pointer" }}
                            >
                                다시 업로드
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* ===== 이미지 탭 ===== */}
            {tab === "image" && (
                <>
                    {!imageResult && (
                        <>
                            <div
                                style={{
                                    border: "2px dashed #ddd",
                                    borderRadius: 12,
                                    padding: 40,
                                    textAlign: "center",
                                    background: imageFiles.length > 0 ? "#fff8f0" : "#fafafa",
                                    position: "relative",
                                    cursor: "pointer",
                                }}
                            >
                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,image/gif"
                                    multiple
                                    onChange={handleImageChange}
                                    style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
                                />
                                <ImageIcon size={40} color="#aaa" style={{ marginBottom: 8 }} />
                                <div style={{ fontSize: 16, color: "#555" }}>클릭하여 리뷰 이미지 업로드</div>
                                <div style={{ fontSize: 13, color: "#aaa", marginTop: 4 }}>jpg, png, webp, gif | 최대 50장</div>
                            </div>
                            <div style={{ marginTop: 12, fontSize: 13, color: "#888" }}>
                                고객이 올린 리뷰 이미지(음식, 제품, 매장 사진 등)를 업로드하면 GPT-4o Vision이 고객 선호도를 분석합니다.
                            </div>
                        </>
                    )}

                    {/* 이미지 미리보기 */}
                    {imagePreviews.length > 0 && !imageResult && (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 8, marginTop: 16 }}>
                            {imagePreviews.map((src, idx) => (
                                <div key={idx} style={{ position: "relative", borderRadius: 8, overflow: "hidden", border: "1px solid #eee" }}>
                                    <img src={src} alt={`리뷰 이미지 ${idx + 1}`} style={{ width: "100%", height: 100, objectFit: "cover" }} />
                                    <button
                                        onClick={() => removeImage(idx)}
                                        style={{ position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", borderRadius: "50%", width: 22, height: 22, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {imageFiles.length > 0 && !imageResult && !imageLoading && (
                        <button
                            onClick={handleImageAnalyze}
                            style={{ marginTop: 20, width: "100%", padding: "14px", background: "#e67e22", color: "#fff", border: "none", borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: "pointer" }}
                        >
                            이미지 AI 분석 시작 ({imageFiles.length}장)
                        </button>
                    )}

                    {imageLoading && (
                        <div style={{ marginTop: 40, textAlign: "center", color: "#888" }}>
                            <Loader2 size={40} color="#e67e22" style={{ marginBottom: 8, animation: "spin 1s linear infinite" }} />
                            <div>이미지를 분석하고 있습니다...</div>
                            <div style={{ fontSize: 13, marginTop: 4 }}>GPT-4o Vision이 고객 선호도 분석 중</div>
                        </div>
                    )}

                    {imageError && <div style={{ marginTop: 16, color: "red", fontSize: 14 }}>{imageError}</div>}

                    {imageResult && (
                        <div style={{ marginTop: 8 }}>
                            <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
                                <div style={{ background: "#fff8f0", borderRadius: 8, padding: "12px 20px", textAlign: "center" }}>
                                    <div style={{ fontSize: 24, fontWeight: 700 }}>{imageResult.meta.total}</div>
                                    <div style={{ fontSize: 12, color: "#888" }}>분석 이미지</div>
                                </div>
                            </div>

                            {/* 이미지 전용: 인기 항목 & 시각적 선호 */}
                            {(imageResult.analysis.popular_items?.length ?? 0) > 0 && (
                                <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 12, marginBottom: 12 }}>
                                    <div style={{ fontWeight: 600, marginBottom: 8, color: "#e67e22", fontSize: 13 }}>인기 항목</div>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                                        {(imageResult.analysis.popular_items || []).map((k) => (
                                            <span key={k} style={{ background: "#fff8f0", border: "1px solid #f0c080", borderRadius: 4, padding: "2px 8px", fontSize: 12 }}>{k}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {(imageResult.analysis.visual_preferences?.length ?? 0) > 0 && (
                                <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 12, marginBottom: 12 }}>
                                    <div style={{ fontWeight: 600, marginBottom: 8, color: "#8e44ad", fontSize: 13 }}>고객 시각적 선호</div>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                                        {(imageResult.analysis.visual_preferences || []).map((k) => (
                                            <span key={k} style={{ background: "#f8f0ff", border: "1px solid #d0a0f0", borderRadius: 4, padding: "2px 8px", fontSize: 12 }}>{k}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 이미지별 설명 */}
                            {(imageResult.analysis.image_descriptions?.length ?? 0) > 0 && (
                                <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 12, marginBottom: 12 }}>
                                    <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13 }}>이미지별 분석</div>
                                    {(imageResult.analysis.image_descriptions || []).map((desc, i) => (
                                        <div key={i} style={{ fontSize: 13, padding: "4px 0", borderBottom: i < (imageResult.analysis.image_descriptions?.length ?? 0) - 1 ? "1px solid #f0f0f0" : "none" }}>
                                            <span style={{ color: "#888", marginRight: 8 }}>#{i + 1}</span>{desc}
                                        </div>
                                    ))}
                                </div>
                            )}

                            <AnalysisCard
                                a={imageResult.analysis}
                                onUseCopy={() => router.push(`/generate?${buildCopyParams(imageResult.analysis)}`)}
                            />
                            <button
                                onClick={() => { setImageResult(null); setImageFiles([]); setImagePreviews([]); setImageError(null); }}
                                style={{ marginTop: 12, width: "100%", padding: "12px", background: "#fff", color: "#555", border: "1px solid #ddd", borderRadius: 8, fontSize: 14, cursor: "pointer" }}
                            >
                                다시 업로드
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* ===== 히스토리 탭 ===== */}
            {tab === "history" && (
                <div>
                    {historyLoading && <div style={{ color: "#888" }}>불러오는 중...</div>}
                    {historyError && <div style={{ color: "red" }}>{historyError}</div>}
                    {!historyLoading && !historyError && historyItems.length === 0 && (
                        <div style={{ color: "#888" }}>분석 히스토리가 없습니다.</div>
                    )}
                    {historyItems.map((item) => (
                        <div
                            key={item.id}
                            style={{ border: "1px solid #ddd", borderRadius: 10, padding: 16, marginBottom: 14 }}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: 15 }}>
                                        {item.filename || "파일명 없음"}
                                    </div>
                                    <div style={{ fontSize: 13, color: "#888", marginTop: 2 }}>
                                        {formatDate(item.created_at)}
                                        {item.total != null && (
                                            <span style={{ marginLeft: 12 }}>
                                                리뷰 {item.total}개 ({item.ok}개 분석)
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div style={{ display: "flex", gap: 8 }}>
                                    <button
                                        onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                                        style={{ padding: "6px 14px", border: "1px solid #ddd", borderRadius: 6, cursor: "pointer", fontSize: 13, background: "#fff" }}
                                    >
                                        {expandedId === item.id ? "접기" : "결과 보기"}
                                    </button>
                                    <button
                                        onClick={() => deleteHistory(item.id)}
                                        disabled={deletingId === item.id}
                                        style={{ padding: "6px 14px", border: "1px solid #fcc", borderRadius: 6, cursor: deletingId === item.id ? "not-allowed" : "pointer", fontSize: 13, background: "#fff", color: "#c00", opacity: deletingId === item.id ? 0.5 : 1 }}
                                    >
                                        {deletingId === item.id ? "삭제 중..." : "삭제"}
                                    </button>
                                </div>
                            </div>

                            {/* 키워드 미리보기 */}
                            {expandedId !== item.id && (
                                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                    {(item.positive_keywords || []).slice(0, 3).map((k) => (
                                        <span key={k} style={{ background: "#f0fff0", border: "1px solid #b2e0b2", borderRadius: 4, padding: "2px 6px", fontSize: 12 }}>{k}</span>
                                    ))}
                                    {item.target_suggestion && (
                                        <span style={{ background: "#e8f4fd", border: "1px solid #aad4f0", borderRadius: 4, padding: "2px 6px", fontSize: 12, color: "#1a6fa8" }}>
                                            {item.target_suggestion}
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* 펼쳐진 상세 */}
                            {expandedId === item.id && item.target_suggestion && (
                                <AnalysisCard
                                    a={{
                                        positive_keywords: item.positive_keywords || [],
                                        negative_keywords: item.negative_keywords || [],
                                        target_suggestion: item.target_suggestion || "",
                                        tone_suggestion: item.tone_suggestion || "",
                                        strength: item.strength || "",
                                        weakness: item.weakness || "",
                                        copy_hint: item.copy_hint || "",
                                    }}
                                    onUseCopy={() => router.push(`/generate?${buildCopyParams(item)}`)}
                                />
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
