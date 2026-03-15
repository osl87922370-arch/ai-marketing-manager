"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TONES = [
    { value: "친근", label: "친근", desc: "따뜻하고 편안한" },
    { value: "전문", label: "전문", desc: "신뢰감 있는" },
    { value: "유머", label: "유머", desc: "재치 있는" },
    { value: "하드셀", label: "하드셀", desc: "강렬한 구매 유도" },
];

export default function GeneratePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const reuseId = searchParams.get("reuse");

    const [productDesc, setProductDesc] = useState("");
    const [target, setTarget] = useState("");
    const [tone, setTone] = useState("친근");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!reuseId) return;

        async function fetchReuseData() {
            try {
                const data: any = await apiFetch(`/ai/history/${reuseId}`);
                const input = data?.input_json ?? {};
                const rawInput = input?.input ?? {};

                const mergedDesc = [
                    rawInput.store_name ? `매장명: ${rawInput.store_name}` : "",
                    rawInput.menu ? `메뉴: ${rawInput.menu}` : "",
                    rawInput.price ? `가격: ${rawInput.price}` : "",
                    rawInput.location ? `위치: ${rawInput.location}` : "",
                    rawInput.feature ? `특징: ${rawInput.feature}` : "",
                    input.goal ? `목표: ${input.goal}` : "",
                    input.channel ? `채널: ${input.channel}` : "",
                    input.product_name ? `상품명: ${input.product_name}` : "",
                ]
                    .filter(Boolean)
                    .join("\n");

                setProductDesc(mergedDesc || data?.input_json?.product_desc || "");
                setTarget(input.target ?? "");
            } catch (e) {
                console.error("재사용 데이터 조회 실패", e);
            }
        }

        fetchReuseData();
    }, [reuseId]);

    async function generate() {
        if (!productDesc.trim() || !target.trim()) {
            setError("상품 설명과 타겟을 모두 입력해주세요.");
            return;
        }

        setError(null);
        setLoading(true);

        try {
            const data = await apiFetch("/ai/generate", {
                method: "POST",
                json: {
                    task: "instagram_caption",
                    userEmail: localStorage.getItem("user_email") ?? "",
                    input: {
                        product_desc: productDesc,
                        tone,
                    },
                    channel: "instagram",
                    goal: "방문 유도",
                    target,
                    product_name: productDesc,
                    params: { variant_count: 3 },
                },
            });

            sessionStorage.setItem("generationResult", JSON.stringify(data));
            localStorage.setItem("target", target);
            localStorage.setItem("tone", tone);
            localStorage.setItem("product", productDesc);
            router.push("/result");
        } catch (e: any) {
            setError(e?.message || "생성 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    }

    const isReady = productDesc.trim().length > 0 && target.trim().length > 0;

    return (
        <div style={{ padding: "40px", maxWidth: 720 }}>
            <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 6 }}>카피 생성</h1>
                <p style={{ color: "#666", fontSize: 15 }}>상품 정보를 입력하면 AI가 SNS 마케팅 카피 3가지를 작성합니다.</p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {/* 상품 설명 */}
                <Card>
                    <CardHeader>
                        <CardTitle style={{ fontSize: 15 }}>상품 / 서비스 설명 <span style={{ color: "red" }}>*</span></CardTitle>
                        <p style={{ fontSize: 13, color: "#888", marginTop: 2 }}>어떤 상품이나 매장인지 자세히 설명할수록 카피 품질이 높아집니다.</p>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            placeholder={"예) 송추가마골 본관 - 30년 전통의 갈비 전문점. 가족 모임, 회식에 적합. 주차 가능."}
                            value={productDesc}
                            onChange={e => setProductDesc(e.target.value)}
                            style={{ minHeight: 100, resize: "none" }}
                        />
                        <div style={{ textAlign: "right", fontSize: 12, color: "#999", marginTop: 4 }}>
                            {productDesc.length}자
                        </div>
                    </CardContent>
                </Card>

                {/* 타겟 */}
                <Card>
                    <CardHeader>
                        <CardTitle style={{ fontSize: 15 }}>타겟 고객 <span style={{ color: "red" }}>*</span></CardTitle>
                        <p style={{ fontSize: 13, color: "#888", marginTop: 2 }}>주요 고객층을 입력하세요.</p>
                    </CardHeader>
                    <CardContent>
                        <Input
                            placeholder="예) 30~40대 가족 단위 고객, 회식을 자주 하는 직장인"
                            value={target}
                            onChange={e => setTarget(e.target.value)}
                        />
                    </CardContent>
                </Card>

                {/* 톤 선택 */}
                <Card>
                    <CardHeader>
                        <CardTitle style={{ fontSize: 15 }}>카피 톤</CardTitle>
                        <p style={{ fontSize: 13, color: "#888", marginTop: 2 }}>원하는 말투를 선택하세요.</p>
                    </CardHeader>
                    <CardContent>
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                            {TONES.map(t => (
                                <button
                                    key={t.value}
                                    type="button"
                                    onClick={() => setTone(t.value)}
                                    style={{
                                        padding: "10px 18px",
                                        borderRadius: 10,
                                        border: tone === t.value ? "2px solid #111" : "1px solid #ddd",
                                        background: tone === t.value ? "#111" : "#fff",
                                        color: tone === t.value ? "#fff" : "#333",
                                        cursor: "pointer",
                                        fontWeight: tone === t.value ? 700 : 400,
                                        fontSize: 14,
                                    }}
                                >
                                    <div>{t.label}</div>
                                    <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>{t.desc}</div>
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {error && (
                    <div style={{ color: "red", fontSize: 14, padding: "8px 12px", background: "#fff0f0", borderRadius: 8 }}>
                        {error}
                    </div>
                )}

                <Button
                    onClick={generate}
                    disabled={!isReady || loading}
                    size="lg"
                    style={{ width: "100%", height: 52, fontSize: 16, marginTop: 4 }}
                >
                    {loading ? (
                        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{
                                width: 18, height: 18, border: "2px solid #fff",
                                borderTop: "2px solid transparent", borderRadius: "50%",
                                display: "inline-block", animation: "spin 0.8s linear infinite"
                            }} />
                            AI가 카피를 작성하는 중...
                        </span>
                    ) : "카피 생성하기"}
                </Button>

                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        </div>
    );
}
