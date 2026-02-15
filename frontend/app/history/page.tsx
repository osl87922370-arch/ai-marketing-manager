"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

type ResultItem = {
    id: number;
    user_email: string;
    product_desc: string;
    target: string;
    tone: string;
    result_text: string;
    created_at: string;
};

export default function HistoryPage() {
    const router = useRouter();

    const [items, setItems] = useState<ResultItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    const [q, setQ] = useState("");
    const [toneFilter, setToneFilter] = useState("ALL");

    const userEmail =
        typeof window !== "undefined" ? localStorage.getItem("user_email") || "" : "";

    useEffect(() => {
        async function load() {
            setLoading(true);
            setErr(null);
            try {
                // 백엔드에서 전체 리스트를 받아오고, 프론트에서 user_email로 필터링
                const data = await apiFetch("/api/results", { method: "GET" });

                const list: ResultItem[] = Array.isArray(data) ? data : [];

                const mine = userEmail
                    ? list.filter((x) => x.user_email === userEmail)
                    : list;

                // 최신순(내림차순) 정렬: id가 증가한다고 가정 (sqlite autoincrement)
                mine.sort((a, b) => b.id - a.id);

                setItems(mine);
            } catch (e: any) {
                console.error(e);
                setErr(e?.message || "불러오기 실패");
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [userEmail]);

    const filtered = useMemo(() => {
        const qq = q.trim().toLowerCase();

        return items.filter((x) => {
            const toneOk = toneFilter === "ALL" ? true : x.tone === toneFilter;

            if (!qq) return toneOk;

            const hay = [
                x.product_desc,
                x.target,
                x.tone,
                x.result_text,
                String(x.id),
            ]
                .join(" ")
                .toLowerCase();

            return toneOk && hay.includes(qq);
        });
    }, [items, q, toneFilter]);

    function openToResult(item: ResultItem) {
        // result 페이지가 localStorage에서 읽는 구조에 맞춰 재주입
        localStorage.setItem("last_product", item.product_desc);
        localStorage.setItem("last_target", item.target);
        localStorage.setItem("last_tone", item.tone);
        localStorage.setItem("last_result", item.result_text);

        router.push("/result");
    }

    function copy(text: string) {
        navigator.clipboard.writeText(text);
        alert("복사 완료");
    }

    return (
        <div style={{ padding: 40, maxWidth: 900 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                <h1 style={{ margin: 0 }}>내 생성 히스토리</h1>
                <div style={{ color: "#666" }}>
                    {userEmail ? `(${userEmail})` : "(로그인 이메일 미저장)"}
                </div>
            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
                <input
                    style={{ flex: 1, padding: 10 }}
                    placeholder="검색: 상품/타겟/톤/문구/id"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                />

                <select
                    style={{ padding: 10 }}
                    value={toneFilter}
                    onChange={(e) => setToneFilter(e.target.value)}
                >
                    <option value="ALL">모든 톤</option>
                    <option value="친근">친근</option>
                    <option value="전문">전문</option>
                    <option value="유머">유머</option>
                    <option value="하드셀">하드셀</option>
                </select>

                <button style={{ padding: "10px 14px" }} onClick={() => router.push("/generate")}>
                    새로 생성
                </button>
            </div>

            <div style={{ marginTop: 16 }}>
                {loading && <div>불러오는 중...</div>}
                {err && (
                    <div style={{ color: "crimson" }}>
                        {err}
                        <div style={{ marginTop: 6, color: "#666" }}>
                            힌트: 로그인에서 user_email 저장이 되어 있어야 “내 것만” 필터됩니다.
                        </div>
                    </div>
                )}

                {!loading && !err && filtered.length === 0 && (
                    <div style={{ color: "#666" }}>
                        히스토리가 없습니다. 먼저 생성 후 저장해보세요.
                    </div>
                )}

                {!loading && !err && filtered.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {filtered.map((x) => (
                            <div
                                key={x.id}
                                style={{
                                    border: "1px solid #e5e5e5",
                                    borderRadius: 10,
                                    padding: 14,
                                }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                                    <div>
                                        <div style={{ fontWeight: 700 }}>
                                            #{x.id} · {x.target} · {x.tone}
                                        </div>
                                        <div style={{ marginTop: 4, color: "#333" }}>
                                            <b>상품</b>: {x.product_desc}
                                        </div>
                                        <div style={{ marginTop: 4, color: "#777", fontSize: 12 }}>
                                            {x.created_at}
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", gap: 8, alignItems: "start" }}>
                                        <button onClick={() => openToResult(x)}>열기</button>
                                        <button onClick={() => copy(x.result_text)}>복사</button>
                                    </div>
                                </div>

                                <div style={{ marginTop: 10 }}>
                                    <textarea
                                        readOnly
                                        value={x.result_text}
                                        style={{ width: "100%", height: 120 }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
