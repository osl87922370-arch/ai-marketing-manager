"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

type SaveResponse = { id: number };
type Variant = {
    headline?: string;
    body?: string;
    cta?: string;
    hashtags?: string[] | string;
};
export default function ResultPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const historyId = searchParams.get("id");
    const [productDesc, setProductDesc] = useState("");
    const [target, setTarget] = useState("");
    const [tone, setTone] = useState("");
    const [resultText, setResultText] = useState("");
    const [variants, setVariants] = useState<Variant[]>([]);
    const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);

    const [copied, setCopied] = useState(false);
    const [saving, setSaving] = useState(false);
    const [savedId, setSavedId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    // sessionStorage에서 최신 생성 결과 읽기

    useEffect(() => {
        async function loadResult() {
            // 1) History 카드 클릭으로 들어온 경우: DB 상세 조회
            if (historyId) {
                try {
                    setError(null);

                    const data = await apiFetch(`/api/history/${historyId}`, {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("access_token") ?? ""}`,
                        },
                    });


                    const detail = data as any;


                    const input =
                        detail?.input_json ??
                        detail?.generation?.input_json ??
                        detail?.input ??
                        {};

                    const nestedInput = input?.input ?? {};

                    const output =
                        detail?.output_json ??
                        detail?.generation?.output_json ??
                        detail?.output ??
                        {};







                    const first =
                        (output?.variants && output.variants.length > 0
                            ? output.variants[0]
                            : null) ||
                        (detail?.variants && detail.variants.length > 0
                            ? detail.variants[0]
                            : null);

                    const hashtagsText = Array.isArray(first?.hashtags)
                        ? first.hashtags.join(" ")
                        : first?.hashtags || "";

                    const text =
                        output?.result_text ||
                        detail?.result_text ||
                        detail?.headline ||
                        (first
                            ? [
                                first.headline || "",
                                first.body || "",
                                first.cta || "",
                                hashtagsText,
                            ]
                                .filter(Boolean)
                                .join("\n\n")
                            : "");

                    setProductDesc(
                        nestedInput?.product_desc ||
                        input?.product_name ||
                        input?.product_desc ||
                        input?.product ||
                        ""
                    );
                    setTarget(input?.target || nestedInput?.target || "");
                    setTone(nestedInput?.tone || input?.tone || "");
                    setResultText(text);
                    return;
                } catch (e: any) {
                    setError(e?.message || "히스토리 상세를 불러오지 못했습니다.");
                    return;
                }
            }

            // 2) generate 페이지에서 바로 들어온 경우: 기존 local/session storage 사용
            const raw = sessionStorage.getItem("generationResult") || "";
            console.log("generationResult raw:", raw);
            let p = localStorage.getItem("product") || "";
            let t = localStorage.getItem("target") || "";
            let toneVal = localStorage.getItem("tone") || "";
            try {
                const parsed = raw ? JSON.parse(raw) : null;
                console.log("parsed result:", parsed);
                const genInput =
                    parsed && parsed.generation && parsed.generation.input
                        ? parsed.generation.input
                        : {};

                const parsedVariants = parsed?.generation?.output?.variants || [];

                setVariants(parsedVariants);
                setSelectedVariantIndex(0);

                if (parsedVariants.length > 0) {
                    const first = parsedVariants[0];
                    setResultText(`${first.headline}\n${first.body}`);
                } else {
                    setResultText("");
                }


                if (!p) p = genInput.product_desc || "";
                if (!t) t = genInput.target || "";
                if (!toneVal) toneVal = genInput.tone || "";




            } catch (e) {
                console.error("parse error", e);
            }

            setProductDesc(p);
            setTarget(t);
            setTone(toneVal);
        }

        loadResult();
    }, [historyId]);


    const canSave = useMemo(() => {
        return (
            productDesc.trim().length > 0 &&
            target.trim().length > 0 &&
            tone.trim().length > 0 &&
            resultText.trim().length > 0
        );
    }, [productDesc, target, tone, resultText]);

    async function onCopy() {
        console.log("COPY CLICKED", resultText);

        try {
            await navigator.clipboard.writeText(resultText);
            setCopied(true);
            setTimeout(() => setCopied(false), 900);
        } catch (e) {
            setError("복사 실패 (브라우저 권한/HTTPS 이슈 가능)");
        }
    }

    async function onSave() {
        setError(null);
        setSaving(true);

        try {
            const user_email =
                localStorage.getItem("user_email") || "unknown@example.com";

            const res = await apiFetch("/ai/results", {
                method: "POST",
                json: {
                    user_email,
                    product_desc: productDesc,
                    target,
                    tone,
                    result_text: resultText,
                },
            });

            const data = res as SaveResponse;
            setSavedId(data.id);
        } catch (e: any) {
            setError(e?.message || "저장 실패");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div style={{ padding: 40, maxWidth: 900 }}>
            <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 18 }}>결과</h1>

            <div style={{ marginBottom: 8 }}>
                <b>타겟:</b> {target || <span style={{ color: "#888" }}>(비어있음)</span>}
            </div>
            <div style={{ marginBottom: 8 }}>
                <b>톤:</b> {tone || <span style={{ color: "#888" }}>(비어있음)</span>}
            </div>
            <div style={{ marginBottom: 14 }}>
                <b>상품:</b>{" "}
                {productDesc || <span style={{ color: "#888" }}>(비어있음)</span>}
            </div>

            {variants.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                    <div style={{ marginBottom: 8, fontWeight: 600 }}>카피 선택</div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {variants.map((variant, index) => (
                            <button
                                key={index}
                                type="button"
                                onClick={() => {
                                    setSelectedVariantIndex(index);
                                    sessionStorage.setItem("selectedVariantIndex", String(index));
                                    const selected = variants[index];
                                    if (selected) {
                                        setResultText(`${selected.headline}\n${selected.body}`);
                                    }
                                }}
                                style={{
                                    textAlign: "left",
                                    padding: 12,
                                    borderRadius: 10,
                                    border:
                                        selectedVariantIndex === index
                                            ? "2px solid #111"
                                            : "1px solid #ddd",
                                    background: selectedVariantIndex === index ? "#f8f8f8" : "#fff",
                                    cursor: "pointer",
                                }}
                            >
                                <div style={{ fontWeight: 600, marginBottom: 6 }}>
                                    {variant.headline || `카피 ${index + 1}`}
                                </div>

                                <div
                                    style={{
                                        fontSize: 14,
                                        color: "#666",
                                        lineHeight: 1.5,
                                        whiteSpace: "pre-wrap",
                                    }}
                                >
                                    {variant.body || ""}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}





            <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                    onClick={() => router.push("/cardnews")}
                    disabled={variants.length === 0}
                    style={{
                        padding: "10px 16px",
                        borderRadius: 8,
                        border: "none",
                        background: "#1a1a1a",
                        color: "#fff",
                        cursor: variants.length > 0 ? "pointer" : "default",
                        opacity: variants.length > 0 ? 1 : 0.4,
                        fontWeight: 600,
                        fontSize: 14,
                    }}
                >
                    카드뉴스 만들기
                </button>
                <button
                    onClick={onCopy}
                    disabled={false}
                    style={{
                        padding: "10px 14px",
                        borderRadius: 8,
                        border: "1px solid #ddd",
                        cursor: "pointer",
                    }}
                >
                    {copied ? "복사됨!" : "복사"}
                </button>


                <button
                    onClick={onSave}
                    disabled={!canSave || saving || !!savedId}
                    style={{
                        padding: "10px 14px",
                        borderRadius: 8,
                        border: "1px solid #ddd",
                        cursor: canSave && !saving && !savedId ? "pointer" : "default",
                        opacity: canSave && !saving && !savedId ? 1 : 0.5,
                    }}
                >
                    {savedId
                        ? "저장 완료"
                        : saving
                            ? "저장 중..."
                            : "저장"}
                </button>
            </div>


            {error && (
                <div style={{ marginTop: 12, color: "red", whiteSpace: "pre-wrap" }}>
                    {error}
                </div>
            )}
        </div>
    );
}

