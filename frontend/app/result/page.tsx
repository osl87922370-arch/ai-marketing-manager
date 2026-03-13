"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";

type SaveResponse = { id: number };
type Variant = {
    headline?: string;
    body?: string;
    cta?: string;
    hashtags?: string[] | string;
};
export default function ResultPage() {
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

                    const vs = Array.isArray(output?.variants) ? output.variants : [];
                    setVariants(vs);

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
            let p = localStorage.getItem("product") || "";
            let t = localStorage.getItem("target") || "";
            let toneVal = localStorage.getItem("tone") || "";
            let text = "";

            try {
                const parsed = raw ? JSON.parse(raw) : null;

                const genInput =
                    parsed && parsed.generation && parsed.generation.input
                        ? parsed.generation.input
                        : {};

                const first =
                    (parsed &&
                        parsed.generation &&
                        parsed.generation.output &&
                        parsed.generation.output.variants &&
                        parsed.generation.output.variants.length > 0
                        ? parsed.generation.output.variants[0]
                        : null) ||
                    (parsed &&
                        parsed.output &&
                        parsed.output.variants &&
                        parsed.output.variants.length > 0
                        ? parsed.output.variants[0]
                        : null) ||
                    (parsed && parsed.variants && parsed.variants.length > 0
                        ? parsed.variants[0]
                        : null);

                if (!p) p = genInput.product_desc || "";
                if (!t) t = genInput.target || "";
                if (!toneVal) toneVal = genInput.tone || "";

                if (first) {
                    const hashtagsText = Array.isArray(first.hashtags)
                        ? first.hashtags.join(" ")
                        : first.hashtags || "";

                    text =
                        (first.headline || "") +
                        "\n\n" +
                        (first.body || "") +
                        "\n\n" +
                        (first.cta || "") +
                        "\n\n" +
                        hashtagsText;
                }
            } catch (e) {
                text = raw;
            }

            setProductDesc(p);
            setTarget(t);
            setTone(toneVal);
            setResultText(text);
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

            const res = await apiFetch("/api/results", {
                method: "POST",
                body: JSON.stringify({
                    user_email,
                    product_desc: productDesc,
                    target,
                    tone,
                    result_text: resultText,
                }),
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
                                onClick={() => setSelectedVariantIndex(index)}
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

            <textarea
                value={
                    variants[selectedVariantIndex]
                        ? [
                            variants[selectedVariantIndex].headline || "",
                            "",
                            variants[selectedVariantIndex].body || "",
                            "",
                            variants[selectedVariantIndex].cta || "",
                            "",
                            Array.isArray(variants[selectedVariantIndex].hashtags)
                                ? variants[selectedVariantIndex].hashtags.join(" ")
                                : variants[selectedVariantIndex].hashtags || "",
                        ].join("\n")
                        : resultText
                }
                readOnly
                rows={12}
                style={{
                    width: "100%",
                    padding: 12,
                    borderRadius: 8,
                    border: "1px solid #ddd",
                    fontSize: 14,
                    lineHeight: 1.5,
                }}
            />

            <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
                <button
                    onClick={onCopy}
                    disabled={!resultText.trim()}
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
                    disabled={!canSave || saving || savedId !== null}
                    style={{
                        padding: "10px 14px",
                        borderRadius: 8,
                        border: "1px solid #ddd",
                        cursor: "pointer",
                    }}
                >
                    {savedId
                        ? `저장됨 (id=${savedId})`
                        : saving
                            ? "저장 중..."
                            : "저장"}
                </button>
            </div>

            {!canSave && (
                <div style={{ marginTop: 12, color: "#b36b00" }}>
                    ⚠️ 저장하려면 target/tone/product/result 값이 모두 있어야 해.
                    (generate 페이지에서 localStorage 저장이 필요)
                </div>
            )}

            {error && (
                <div style={{ marginTop: 12, color: "red", whiteSpace: "pre-wrap" }}>
                    {error}
                </div>
            )}
        </div>
    );
}

