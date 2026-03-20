"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Loader2, Trophy, TrendingUp, TrendingDown } from "lucide-react";

type PerfItem = {
    generation_id: string;
    headline: string;
    channel: string;
    impressions: number;
    clicks: number;
    ctr: number;
    conversions: number;
    cost: number;
    revenue: number;
};

export default function PerformancePage() {
    const { plan } = useAuth();
    const [items, setItems] = useState<PerfItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (plan !== "pro") return;
        setLoading(true);
        apiFetch<{ ok: boolean; data: PerfItem[] }>("/ai/performance/compare")
            .then((res) => setItems(res.data || []))
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, [plan]);

    if (plan !== "pro") {
        return (
            <div style={{ padding: 40 }}>
                <h1 style={{ marginBottom: 8 }}>카피별 성과 비교</h1>
                <p style={{ color: "#888" }}>프로 전용 기능입니다. 플랜을 업그레이드해 주세요.</p>
            </div>
        );
    }

    return (
        <div style={{ padding: 40, maxWidth: 1000 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>카피별 성과 비교</h1>
            <p style={{ color: "#888", marginBottom: 24, fontSize: 14 }}>
                어떤 카피가 가장 효과적인지 한눈에 비교하세요.
            </p>

            {loading && (
                <div style={{ textAlign: "center", padding: 40 }}>
                    <Loader2 size={32} className="animate-spin" style={{ margin: "0 auto" }} />
                </div>
            )}

            {error && <div style={{ color: "red", marginBottom: 16 }}>{error}</div>}

            {!loading && items.length === 0 && (
                <div style={{ color: "#888", textAlign: "center", padding: 40 }}>
                    아직 성과 데이터가 없습니다. GA 대시보드에서 CSV를 가져와주세요.
                </div>
            )}

            {!loading && items.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {items.map((item, index) => {
                        const isTop = index === 0;
                        const isBottom = index === items.length - 1 && items.length > 1;

                        return (
                            <div
                                key={item.generation_id}
                                style={{
                                    border: isTop ? "2px solid #f59e0b" : "1px solid #e5e7eb",
                                    borderRadius: 12,
                                    padding: 20,
                                    background: isTop ? "#fffbeb" : "#fff",
                                    position: "relative",
                                }}
                            >
                                {/* 순위 배지 */}
                                <div
                                    style={{
                                        position: "absolute",
                                        top: -10,
                                        left: 16,
                                        background: isTop ? "#f59e0b" : isBottom ? "#ef4444" : "#6b7280",
                                        color: "#fff",
                                        borderRadius: 12,
                                        padding: "2px 10px",
                                        fontSize: 11,
                                        fontWeight: 700,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 4,
                                    }}
                                >
                                    {isTop ? <Trophy size={12} /> : isBottom ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
                                    {index + 1}위
                                </div>

                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>
                                            {item.headline || "제목 없음"}
                                        </div>
                                        <div style={{ fontSize: 12, color: "#888" }}>
                                            {item.channel}
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", gap: 24, textAlign: "center" }}>
                                        <div>
                                            <div style={{ fontSize: 12, color: "#888" }}>노출</div>
                                            <div style={{ fontWeight: 600 }}>{item.impressions.toLocaleString()}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 12, color: "#888" }}>클릭</div>
                                            <div style={{ fontWeight: 600 }}>{item.clicks.toLocaleString()}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 12, color: "#888" }}>CTR</div>
                                            <div style={{ fontWeight: 700, color: isTop ? "#f59e0b" : "#111" }}>
                                                {item.ctr}%
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 12, color: "#888" }}>전환</div>
                                            <div style={{ fontWeight: 600 }}>{item.conversions}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
