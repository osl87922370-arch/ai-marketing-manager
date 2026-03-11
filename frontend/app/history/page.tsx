"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

type HistoryItem = {
    id: string;
    task?: string;
    headline?: string;
    created_at?: string;
    input_json?: {
        product_name?: string;
        target?: string;
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

    async function handleDelete(id: string) {
        const ok = window.confirm("삭제 후 목록에서 보이지 않습니다. 계속하시겠습니까?");
        if (!ok) return;

        setErr(null);

        const res = await fetch(`/api/history/${id}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("access_token") ?? ""}`,
            },
        });

        if (!res.ok) {
            setErr("삭제에 실패했습니다. 다시 시도해주세요.");
            return;
        }
        setItems((prev) => prev.filter((item) => item.id !== id));
    }
    const [items, setItems] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);
    const [userEmail, setUserEmail] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);


                const data = await apiFetch<HistoryResponse>("/api/history");
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

    const filtered = items; // 필요하면 필터 로직 추가

    return (
        <div style={{ padding: 40, maxWidth: 900 }}>
            {/* ===== 헤더 ===== */}
            <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                <h1 style={{ margin: 0 }}>내 생성 히스토리</h1>
                <div style={{ color: "#666" }}>
                    {userEmail ? `(${userEmail})` : "(로그인 이메일 미저장)"}
                </div>
            </div>

            {/* ===== 로딩 ===== */}
            {loading && <div style={{ marginTop: 20 }}>로딩중...</div>}

            {/* ===== 에러 ===== */}
            {!loading && err && (
                <div style={{ marginTop: 20, color: "red" }}>{err}</div>
            )}

            {/* ===== 데이터 없음 ===== */}
            {!loading && !err && filtered.length === 0 && (
                <div style={{ marginTop: 20 }}>저장된 히스토리가 없습니다.</div>
            )}

            {/* ===== 리스트 ===== */}
            {!loading && !err && filtered.length > 0 && (
                <div style={{ marginTop: 20 }}>
                    {filtered.map((x) => (
                        <div
                            key={x.id}
                            style={{
                                border: "1px solid #ddd",
                                borderRadius: 8,
                                padding: 16,
                                marginBottom: 16,
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

                                <button
                                    type="button"
                                    onClick={() => router.push(`/generate?reuse=${x.id}`)}
                                >
                                    재사용
                                </button>
                                <button type="button" onClick={() => handleDelete(x.id)}>
                                    삭제
                                </button>
                            </div>

                            {/* 결과 텍스트 */}
                            <textarea
                                readOnly
                                value={x.headline || ""}
                                style={{ width: "100%", height: 120 }}
                            />


                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
