"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Copy, ExternalLink, Loader2 } from "lucide-react";

type UtmItem = {
    generation_id: string;
    headline: string;
    channel: string;
    created_at: string;
    utm_urls: string[];
};

export default function UtmPage() {
    const { plan } = useAuth();
    const [items, setItems] = useState<UtmItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (plan !== "pro") return;
        setLoading(true);
        apiFetch<{ ok: boolean; data: UtmItem[] }>("/ai/utm/list")
            .then((res) => setItems(res.data || []))
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, [plan]);

    if (plan !== "pro") {
        return (
            <div style={{ padding: 40 }}>
                <h1 style={{ marginBottom: 8 }}>UTM 관리</h1>
                <p style={{ color: "#888" }}>프로 전용 기능입니다. 플랜을 업그레이드해 주세요.</p>
            </div>
        );
    }

    return (
        <div style={{ padding: 40, maxWidth: 900 }}>
            <h1 style={{ marginBottom: 4, fontSize: 24, fontWeight: 700 }}>UTM 관리</h1>
            <p style={{ color: "#888", marginBottom: 24 }}>
                생성된 카피에 자동 첨부된 UTM 링크를 관리합니다.
            </p>

            {loading && (
                <div style={{ textAlign: "center", padding: 40 }}>
                    <Loader2 size={32} className="animate-spin" style={{ margin: "0 auto" }} />
                </div>
            )}

            {error && <div style={{ color: "red", marginBottom: 16 }}>{error}</div>}

            {!loading && items.length === 0 && (
                <div style={{ color: "#888", textAlign: "center", padding: 40 }}>
                    UTM 링크가 아직 없습니다. 카피를 생성하면 자동으로 UTM이 추가됩니다.
                </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {items.map((item) => (
                    <div
                        key={item.generation_id}
                        style={{
                            border: "1px solid #e5e7eb",
                            borderRadius: 12,
                            padding: 20,
                            background: "#fff",
                        }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                            <div>
                                <div style={{ fontWeight: 600, fontSize: 15 }}>{item.headline || "제목 없음"}</div>
                                <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
                                    {item.channel} · {item.created_at ? new Date(item.created_at).toLocaleDateString("ko-KR") : ""}
                                </div>
                            </div>
                        </div>

                        {item.utm_urls.map((url, i) => (
                            <div
                                key={i}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    background: "#f8fafc",
                                    borderRadius: 8,
                                    padding: "8px 12px",
                                    marginTop: 8,
                                    fontSize: 13,
                                    wordBreak: "break-all",
                                }}
                            >
                                <ExternalLink size={14} style={{ flexShrink: 0, color: "#888" }} />
                                <span style={{ flex: 1 }}>{url}</span>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(url);
                                        alert("복사되었습니다!");
                                    }}
                                    style={{
                                        flexShrink: 0,
                                        background: "none",
                                        border: "none",
                                        cursor: "pointer",
                                        padding: 4,
                                    }}
                                >
                                    <Copy size={14} color="#666" />
                                </button>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
