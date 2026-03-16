"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { FileText, Clock, Upload } from "lucide-react";

type RecentGen = { id: string; headline: string | null; channel?: string | null; created_at: string | null };
type LastAnalysis = { filename: string | null; total: number | null; target_suggestion: string | null; created_at: string | null };
type DashboardData = {
    total_generations: number;
    total_analyses: number;
    channel_stats: Record<string, number>;
    recent_generations: RecentGen[];
    last_analysis: LastAnalysis | null;
};

const CHANNEL_LABELS: Record<string, { label: string; color: string; bg: string }> = {
    instagram: { label: "인스타그램", color: "#c13584", bg: "#fdf0f8" },
    blog:      { label: "블로그",     color: "#03c75a", bg: "#f0fdf6" },
    sms:       { label: "문자/SMS",   color: "#ff6b00", bg: "#fff4ee" },
    naver:     { label: "네이버 플레이스", color: "#1ec800", bg: "#edfbf3" },
};

function formatDate(value?: string | null) {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function DashboardPage() {
    const router = useRouter();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiFetch<DashboardData>("/ai/dashboard")
            .then(setData)
            .catch(() => setData(null))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div style={{ padding: 40, color: "#888" }}>로딩 중...</div>;

    return (
        <div style={{ padding: 40, maxWidth: 900 }}>
            <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 6 }}>대시보드</h1>
            <p style={{ color: "#888", marginBottom: 32, fontSize: 14 }}>내 마케팅 활동 현황</p>

            {/* 통계 카드 */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 32 }}>
                <StatCard
                    icon={<FileText size={22} color="#1a6fa8" />}
                    label="총 카피 생성"
                    value={data?.total_generations ?? 0}
                    unit="회"
                    bg="#e8f4fd"
                    onClick={() => router.push("/history")}
                />
                <StatCard
                    icon={<Upload size={22} color="#27ae60" />}
                    label="총 리뷰 분석"
                    value={data?.total_analyses ?? 0}
                    unit="회"
                    bg="#e8f8f0"
                    onClick={() => router.push("/upload")}
                />
            </div>

            {/* 채널별 통계 */}
            {data?.channel_stats && Object.keys(data.channel_stats).length > 0 && (
                <div style={{ border: "1px solid #eee", borderRadius: 10, padding: 20, marginBottom: 20 }}>
                    <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 14 }}>채널별 생성 현황</div>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        {Object.entries(data.channel_stats).map(([ch, count]) => {
                            const info = CHANNEL_LABELS[ch] ?? { label: ch, color: "#888", bg: "#f5f5f5" };
                            return (
                                <div key={ch} style={{
                                    background: info.bg, borderRadius: 10, padding: "12px 18px",
                                    border: `1px solid ${info.color}33`, minWidth: 100, textAlign: "center",
                                }}>
                                    <div style={{ fontSize: 22, fontWeight: 700, color: info.color }}>{count}</div>
                                    <div style={{ fontSize: 12, color: info.color, marginTop: 2 }}>{info.label}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                {/* 최근 생성 히스토리 */}
                <div style={{ border: "1px solid #eee", borderRadius: 10, padding: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                        <div style={{ fontWeight: 600, fontSize: 15 }}>최근 카피 생성</div>
                        <button
                            onClick={() => router.push("/history")}
                            style={{ fontSize: 12, color: "#1a6fa8", border: "none", background: "none", cursor: "pointer" }}
                        >
                            전체 보기 →
                        </button>
                    </div>
                    {data?.recent_generations.length === 0 ? (
                        <div style={{ color: "#aaa", fontSize: 14 }}>생성 내역이 없습니다.</div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {data?.recent_generations.map((g) => (
                                <div
                                    key={g.id}
                                    onClick={() => router.push(`/result?id=${g.id}`)}
                                    style={{ cursor: "pointer", padding: "10px 12px", borderRadius: 8, background: "#fafafa", border: "1px solid #f0f0f0" }}
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                                        {g.channel && CHANNEL_LABELS[g.channel] && (
                                            <span style={{
                                                fontSize: 11, fontWeight: 600, padding: "1px 7px", borderRadius: 20,
                                                background: CHANNEL_LABELS[g.channel].bg,
                                                color: CHANNEL_LABELS[g.channel].color,
                                            }}>
                                                {CHANNEL_LABELS[g.channel].label}
                                            </span>
                                        )}
                                        <span style={{ fontWeight: 500, fontSize: 14 }}>
                                            {g.headline || "(제목 없음)"}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: 12, color: "#aaa", display: "flex", alignItems: "center", gap: 4 }}>
                                        <Clock size={11} /> {formatDate(g.created_at)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 최근 리뷰 분석 */}
                <div style={{ border: "1px solid #eee", borderRadius: 10, padding: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                        <div style={{ fontWeight: 600, fontSize: 15 }}>최근 리뷰 분석</div>
                        <button
                            onClick={() => router.push("/upload")}
                            style={{ fontSize: 12, color: "#1a6fa8", border: "none", background: "none", cursor: "pointer" }}
                        >
                            분석하기 →
                        </button>
                    </div>
                    {!data?.last_analysis ? (
                        <div style={{ color: "#aaa", fontSize: 14 }}>분석 내역이 없습니다.</div>
                    ) : (
                        <div style={{ padding: "10px 12px", borderRadius: 8, background: "#fafafa", border: "1px solid #f0f0f0" }}>
                            <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 4 }}>
                                {data.last_analysis.filename || "파일명 없음"}
                            </div>
                            {data.last_analysis.total != null && (
                                <div style={{ fontSize: 13, color: "#555", marginBottom: 4 }}>
                                    리뷰 {data.last_analysis.total}개 분석
                                </div>
                            )}
                            {data.last_analysis.target_suggestion && (
                                <div style={{ fontSize: 13, color: "#1a6fa8" }}>
                                    추천 타겟: {data.last_analysis.target_suggestion}
                                </div>
                            )}
                            <div style={{ fontSize: 12, color: "#aaa", marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
                                <Clock size={11} /> {formatDate(data.last_analysis.created_at)}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 빠른 이동 */}
            <div style={{ marginTop: 28, display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button
                    onClick={() => router.push("/generate")}
                    style={{ padding: "12px 20px", background: "#1a1a1a", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: "pointer" }}
                >
                    카피 생성하기
                </button>
                <button
                    onClick={() => router.push("/upload")}
                    style={{ padding: "12px 20px", background: "#fff", color: "#333", border: "1px solid #ddd", borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: "pointer" }}
                >
                    리뷰 분석하기
                </button>
            </div>
        </div>
    );
}

function StatCard({ icon, label, value, unit, bg, onClick }: {
    icon: React.ReactNode;
    label: string;
    value: number;
    unit: string;
    bg: string;
    onClick: () => void;
}) {
    return (
        <div
            onClick={onClick}
            style={{ background: bg, borderRadius: 10, padding: "20px 24px", cursor: "pointer", transition: "opacity 0.15s" }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
            <div style={{ marginBottom: 10 }}>{icon}</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{value}</div>
            <div style={{ fontSize: 13, color: "#555", marginTop: 2 }}>
                {label} ({unit})
            </div>
        </div>
    );
}
