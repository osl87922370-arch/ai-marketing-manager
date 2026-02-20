"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type HistoryItem = {
    id: string;
    result_text: string;
    created_at?: string;
};

export default function HistoryPage() {
    const router = useRouter();

    const [items, setItems] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);
    const [userEmail, setUserEmail] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);

                // TODO: 실제 API로 교체
                const res = await fetch("/ai/history");

                if (!res.ok) {
                    throw new Error("히스토리 조회 실패");
                }

                const data = await res.json();
                setItems(data || []);
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
                                    {x.created_at || ""}
                                </div>

                                <button
                                    onClick={() => router.push(`/generate?reuse=${x.id}`)}
                                >
                                    재사용
                                </button>
                            </div>

                            {/* 결과 텍스트 */}
                            <textarea
                                readOnly
                                value={x.result_text}
                                style={{ width: "100%", height: 120 }}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
