"use client";

import { useEffect, useState, useRef } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Loader2, Upload, TrendingUp, MousePointer, Eye, DollarSign, Target, RefreshCw, HelpCircle, X } from "lucide-react";

type Summary = {
    impressions: number;
    clicks: number;
    conversions: number;
    cost: number;
    revenue: number;
    ctr: number;
    roas: number;
};

type TrendItem = {
    date: string;
    impressions: number;
    clicks: number;
    conversions: number;
};

export default function GaDashboardPage() {
    const { plan } = useAuth();
    const [summary, setSummary] = useState<Summary | null>(null);
    const [trend, setTrend] = useState<TrendItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [importing, setImporting] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [showGuide, setShowGuide] = useState(false);
    const [error, setError] = useState("");
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (plan !== "pro") return;
        setLoading(true);
        Promise.all([
            apiFetch<{ ok: boolean; data: Summary }>("/ai/ga/summary"),
            apiFetch<{ ok: boolean; data: TrendItem[] }>("/ai/ga/trend?days=30"),
        ])
            .then(([summaryRes, trendRes]) => {
                setSummary(summaryRes.data);
                setTrend(trendRes.data || []);
            })
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, [plan]);

    async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setImporting(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            const res = await apiFetch<{ ok: boolean; imported: number }>("/ai/ga/import", {
                method: "POST",
                body: formData,
            });
            alert(`${res.imported}건 가져오기 완료!`);
            window.location.reload();
        } catch (err: any) {
            alert("가져오기 실패: " + err.message);
        } finally {
            setImporting(false);
        }
    }

    if (plan !== "pro") {
        return (
            <div style={{ padding: 40 }}>
                <h1 style={{ marginBottom: 8 }}>GA 성과 대시보드</h1>
                <p style={{ color: "#888" }}>프로 전용 기능입니다. 플랜을 업그레이드해 주세요.</p>
            </div>
        );
    }

    const statCards = summary
        ? [
              { label: "노출수", value: summary.impressions.toLocaleString(), icon: Eye, color: "#3b82f6" },
              { label: "클릭수", value: summary.clicks.toLocaleString(), icon: MousePointer, color: "#10b981" },
              { label: "CTR", value: `${summary.ctr}%`, icon: TrendingUp, color: "#f59e0b" },
              { label: "전환수", value: summary.conversions.toLocaleString(), icon: Target, color: "#8b5cf6" },
              { label: "비용", value: `₩${summary.cost.toLocaleString()}`, icon: DollarSign, color: "#ef4444" },
              { label: "ROAS", value: `${summary.roas}x`, icon: TrendingUp, color: "#06b6d4" },
          ]
        : [];

    const maxClicks = Math.max(...trend.map((t) => t.clicks), 1);

    return (
        <div style={{ padding: 40, maxWidth: 1000 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>GA 성과 대시보드</h1>
                    <p style={{ color: "#888", fontSize: 14 }}>캠페인 성과 지표를 한눈에 확인하세요.</p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                    <button
                        onClick={() => setShowGuide(true)}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "8px 16px",
                            borderRadius: 8,
                            border: "1px solid #d1d5db",
                            background: "#fff",
                            cursor: "pointer",
                            fontSize: 13,
                        }}
                    >
                        <HelpCircle size={14} />
                        이용 가이드
                    </button>
                    <button
                        onClick={async () => {
                            setSyncing(true);
                            try {
                                const res = await apiFetch<{ ok: boolean; imported: number; error?: string }>("/ai/ga/sync-meta", { method: "POST" });
                                if (res.ok) {
                                    alert(`Meta 광고 데이터 ${res.imported}건 동기화 완료!`);
                                    window.location.reload();
                                } else {
                                    alert("동기화 실패: " + (res.error || "알 수 없는 오류"));
                                }
                            } catch (err: any) {
                                alert("동기화 실패: " + err.message);
                            } finally {
                                setSyncing(false);
                            }
                        }}
                        disabled={syncing}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "8px 16px",
                            borderRadius: 8,
                            border: "none",
                            background: "#1877f2",
                            color: "#fff",
                            cursor: "pointer",
                            fontSize: 13,
                            fontWeight: 600,
                        }}
                    >
                        <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
                        {syncing ? "동기화 중..." : "Meta 광고 동기화"}
                    </button>
                    <input
                        ref={fileRef}
                        type="file"
                        accept=".csv"
                        onChange={handleImport}
                        style={{ display: "none" }}
                    />
                    <button
                        onClick={() => fileRef.current?.click()}
                        disabled={importing}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "8px 16px",
                            borderRadius: 8,
                            border: "1px solid #d1d5db",
                            background: "#fff",
                            cursor: "pointer",
                            fontSize: 13,
                        }}
                    >
                        <Upload size={14} />
                        {importing ? "가져오는 중..." : "CSV 가져오기"}
                    </button>
                </div>
            </div>

            {loading && (
                <div style={{ textAlign: "center", padding: 40 }}>
                    <Loader2 size={32} className="animate-spin" style={{ margin: "0 auto" }} />
                </div>
            )}

            {error && <div style={{ color: "red", marginBottom: 16 }}>{error}</div>}

            {!loading && summary && (
                <>
                    {/* 요약 카드 */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
                        {statCards.map((card) => (
                            <div
                                key={card.label}
                                style={{
                                    border: "1px solid #e5e7eb",
                                    borderRadius: 12,
                                    padding: 20,
                                    background: "#fff",
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                                    <card.icon size={18} color={card.color} />
                                    <span style={{ fontSize: 13, color: "#888" }}>{card.label}</span>
                                </div>
                                <div style={{ fontSize: 28, fontWeight: 700, color: card.color }}>
                                    {card.value}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* 클릭 트렌드 차트 */}
                    <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 20, background: "#fff" }}>
                        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>일별 클릭 트렌드 (최근 30일)</h2>
                        {trend.length === 0 ? (
                            <p style={{ color: "#888", textAlign: "center", padding: 20 }}>
                                데이터가 없습니다. CSV를 가져와주세요.
                            </p>
                        ) : (
                            <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 160 }}>
                                {trend.map((t) => (
                                    <div
                                        key={t.date}
                                        title={`${t.date}: ${t.clicks}클릭`}
                                        style={{
                                            flex: 1,
                                            background: "linear-gradient(to top, #3b82f6, #60a5fa)",
                                            borderRadius: "4px 4px 0 0",
                                            height: `${(t.clicks / maxClicks) * 100}%`,
                                            minHeight: 2,
                                            cursor: "pointer",
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* 이용 가이드 팝업 */}
            {showGuide && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: "rgba(0,0,0,0.5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 1000,
                    }}
                    onClick={() => setShowGuide(false)}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: "#fff",
                            borderRadius: 16,
                            padding: 32,
                            maxWidth: 520,
                            width: "90%",
                            maxHeight: "80vh",
                            overflowY: "auto",
                            position: "relative",
                        }}
                    >
                        <button
                            onClick={() => setShowGuide(false)}
                            style={{
                                position: "absolute",
                                top: 16,
                                right: 16,
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                            }}
                        >
                            <X size={20} color="#888" />
                        </button>

                        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>
                            광고 성과 데이터 가져오기
                        </h2>

                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            <div style={{ display: "flex", gap: 12 }}>
                                <div style={{ background: "#3b82f6", color: "#fff", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>1</div>
                                <div>
                                    <div style={{ fontWeight: 600, marginBottom: 2 }}>광고 관리자 접속</div>
                                    <div style={{ fontSize: 13, color: "#666" }}>facebook.com/adsmanager 에 접속합니다.</div>
                                </div>
                            </div>

                            <div style={{ display: "flex", gap: 12 }}>
                                <div style={{ background: "#3b82f6", color: "#fff", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>2</div>
                                <div>
                                    <div style={{ fontWeight: 600, marginBottom: 2 }}>기간 설정</div>
                                    <div style={{ fontSize: 13, color: "#666" }}>오른쪽 상단 날짜에서 원하는 기간을 선택합니다.</div>
                                </div>
                            </div>

                            <div style={{ display: "flex", gap: 12 }}>
                                <div style={{ background: "#3b82f6", color: "#fff", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>3</div>
                                <div>
                                    <div style={{ fontWeight: 600, marginBottom: 2 }}>데이터 내보내기</div>
                                    <div style={{ fontSize: 13, color: "#666" }}>오른쪽 상단 "보고서" → "표 데이터 내보내기" → CSV 형식으로 다운로드합니다.</div>
                                </div>
                            </div>

                            <div style={{ display: "flex", gap: 12 }}>
                                <div style={{ background: "#3b82f6", color: "#fff", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>4</div>
                                <div>
                                    <div style={{ fontWeight: 600, marginBottom: 2 }}>업로드</div>
                                    <div style={{ fontSize: 13, color: "#666" }}>이 페이지에서 "CSV 가져오기" 버튼을 클릭하고 다운로드한 파일을 선택합니다.</div>
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: 20, padding: 12, background: "#f0f9ff", borderRadius: 8, fontSize: 13, color: "#1e40af" }}>
                            💡 CSV에 date, campaign_name, impressions, clicks, conversions, cost, revenue 컬럼이 포함되어야 합니다.
                        </div>

                        <button
                            onClick={() => setShowGuide(false)}
                            style={{
                                marginTop: 20,
                                width: "100%",
                                padding: "10px 0",
                                borderRadius: 8,
                                border: "none",
                                background: "#3b82f6",
                                color: "#fff",
                                fontSize: 14,
                                fontWeight: 600,
                                cursor: "pointer",
                            }}
                        >
                            확인
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
