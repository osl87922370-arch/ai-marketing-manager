"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

type HistoryItem = {
    id: string;
    task?: string;
    headline?: string;
    body?: string;
    cta?: string;
    hashtags?: string[] | null;
    created_at?: string;
    input_json?: {
        product_name?: string;
        target?: string;
        tone?: string;
        channel?: string;
        goal?: string;
        input?: {
            store_name?: string;
            menu?: string;
            price?: string;
            location?: string;
            feature?: string;
        };
        params?: {
            variant_count?: number;
        };
    };
};

type HistoryResponse = {
    items?: HistoryItem[];
    user_email?: string | null;
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

export default function HistoryPage() {
    const router = useRouter();

    const handleCardClick = (id: string) => {
        router.push(`/result?id=${id}`);
    };

    async function handleDelete(id: string) {

        const ok = window.confirm("삭제 후 목록에서 보이지 않습니다. 계속하시겠습니까?");
        if (!ok) return;

        setErr(null);
        setDeletingId(id);

        try {
            await apiFetch(`/ai/history/${id}`, { method: "DELETE" });
        } catch {
            setErr("삭제에 실패했습니다. 다시 시도해주세요.");
            setDeletingId(null);
            return;
        }

        setDeletingId(null);
        setItems((prev) => prev.filter((item) => item.id !== id));
    }
    const [items, setItems] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [query, setQuery] = useState("");

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);


                const data = await apiFetch<HistoryResponse>("/ai/history");
                setItems(data.items || []);
                setUserEmail(data.user_email || null);
            } catch (e: any) {
                setErr(e.message || "에러 발생");
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    const filtered = items.filter((item) =>
        (item.headline || "").toLowerCase().includes(query.toLowerCase())
    );

    return (
        <div style={{ padding: 40, maxWidth: 900 }}>
            {/* ===== 헤더 ===== */}
            <div
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: 12,
                }}
            >
                <h1 style={{ margin: 0, lineHeight: 1.2 }}>내 생성 히스토리</h1>
                <div style={{ wordBreak: "break-all" }}>
                    {userEmail ? `(${userEmail})` : "(로그인 이메일 미저장)"}
                </div>
            </div>


            {/* 여기 아래에 추가 */}

            <div style={{ marginTop: 16, marginBottom: 16 }}>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="제목으로 검색"
                    style={{
                        width: "100%",
                        maxWidth: 360,
                        padding: "10px 12px",
                        border: "1px solid #ddd",
                        borderRadius: 8,
                        fontSize: 14,
                    }}
                />
            </div>

            {/* ===== 로딩 ===== */}
            {loading && <div style={{ marginTop: 20 }}>로딩중...</div>}

            {/* ===== 에러 ===== */}
            {!loading && err && (
                <div style={{ marginTop: 20, color: "red" }}>{err}</div>
            )}

            {/* ===== 데이터 없음 ===== */}
            {!loading && !err && items.length === 0 && (
                <div style={{ marginTop: 20 }}>저장된 히스토리가 없습니다.</div>
            )}
            {!loading && !err && filtered.length === 0 && (
                <div style={{ marginTop: 20, color: "#888" }}>
                    검색 결과가 없습니다.
                </div>
            )}

            {/* ===== 리스트 ===== */}
            {!loading && !err && filtered.length > 0 && (
                <div style={{ marginTop: 20 }}>
                    {filtered.map((x) => (
                        <div
                            key={x.id}
                            onClick={() => handleCardClick(x.id)}
                            style={{
                                border: "1px solid #ddd",
                                borderRadius: 8,
                                padding: 16,
                                marginBottom: 16,
                                transition: "all 0.2s ease",
                                cursor: "pointer"
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.15)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.boxShadow = "none";
                            }}
                        >


                            {/* 상단 버튼 영역 */}
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    marginBottom: 10,
                                }}
                            >
                                <div style={{ fontSize: 14, color: "#888" }}>
                                    {formatDate(x.created_at)}
                                </div>
                                <div style={{ display: "flex", gap: 12 }}>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            router.push(`/generate?reuse=${x.id}`);
                                        }}
                                    >
                                        재사용
                                    </button>
                                    <button
                                        type="button"
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            const text = [x.headline, x.body, x.cta, ...(Array.isArray(x.hashtags) ? x.hashtags : [])].filter(Boolean).join("\n");
                                            await navigator.clipboard.writeText(text);
                                            setCopiedId(x.id);
                                            setTimeout(() => setCopiedId(null), 1000);
                                        }}

                                    >
                                        {copiedId === x.id ? "복사됨!" : "복사"}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(x.id);
                                        }}
                                        disabled={deletingId === x.id}
                                        style={{
                                            opacity: deletingId === x.id ? 0.5 : 1,
                                            cursor: deletingId === x.id ? "not-allowed" : "pointer",
                                        }}
                                    >
                                        {deletingId === x.id ? "삭제 중..." : "삭제"}
                                    </button>
                                </div>
                            </div>
                            {/* 상품/타겟 태그 */}
                            {(x.input_json?.product_name || x.input_json?.target || x.input_json?.tone) && (
                                <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
                                    {x.input_json?.product_name && (
                                        <span style={{ fontSize: 12, background: "#f0f0f0", borderRadius: 4, padding: "2px 8px", color: "#555" }}>
                                            {x.input_json.product_name}
                                        </span>
                                    )}
                                    {x.input_json?.target && (
                                        <span style={{ fontSize: 12, background: "#e8f4fd", borderRadius: 4, padding: "2px 8px", color: "#1a6fa8" }}>
                                            {x.input_json.target}
                                        </span>
                                    )}
                                    {x.input_json?.tone && (
                                        <span style={{ fontSize: 12, background: "#f0faf0", borderRadius: 4, padding: "2px 8px", color: "#2d7a2d" }}>
                                            {x.input_json.tone}
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* 카피 내용 */}
                            <div style={{ background: "#fafafa", border: "1px solid #eee", borderRadius: 6, padding: 12 }}>
                                {x.headline && (
                                    <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>
                                        {x.headline}
                                    </div>
                                )}
                                {x.body && (
                                    <div style={{ fontSize: 14, color: "#444", marginBottom: 6, lineHeight: 1.6 }}>
                                        {x.body}
                                    </div>
                                )}
                                {x.cta && (
                                    <div style={{ fontSize: 13, color: "#1a6fa8", fontWeight: 500, marginBottom: 6 }}>
                                        → {x.cta}
                                    </div>
                                )}
                                {x.hashtags && x.hashtags.length > 0 && (
                                    <div style={{ fontSize: 12, color: "#888" }}>
                                        {(Array.isArray(x.hashtags) ? x.hashtags : []).join(" ")}
                                    </div>
                                )}
                            </div>


                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}  
