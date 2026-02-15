"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";

type SaveResponse = { id: number };

export default function ResultPage() {
    const [productDesc, setProductDesc] = useState("");
    const [target, setTarget] = useState("");
    const [tone, setTone] = useState("");
    const [resultText, setResultText] = useState("");

    const [copied, setCopied] = useState(false);
    const [saving, setSaving] = useState(false);
    const [savedId, setSavedId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    // localStorage에서 최신 생성 결과 읽기
    useEffect(() => {
        const p = localStorage.getItem("last_product") || "";
        const t = localStorage.getItem("last_target") || "";
        const toneVal = localStorage.getItem("last_tone") || "";
        const r = localStorage.getItem("last_result") || "";

        setProductDesc(p);
        setTarget(t);
        setTone(toneVal);
        setResultText(r);
    }, []);

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

            <textarea
                value={resultText}
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

