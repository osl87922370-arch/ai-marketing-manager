
"use client";

import { generateCopy } from "@/lib/api";
import { useState } from "react";

export default function TestPage() {
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleGenerate = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await generateCopy("카페 할인 이벤트");
            setResult(res);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: 40 }}>
            <h1 style={{ fontSize: 22, marginBottom: 20 }}>AI 생성 테스트</h1>

            <button onClick={handleGenerate} disabled={loading}>
                {loading ? "생성 중..." : "AI 생성"}
            </button>

            {error && <p style={{ color: "red", marginTop: 12 }}>{error}</p>}

            {result && (
                <div style={{ marginTop: 20 }}>
                    <h3>{result.headline}</h3>
                    <p>{result.body}</p>
                    <strong>{result.cta}</strong>
                    <div>{result.hashtags.join(" ")}</div>
                </div>
            )}
        </div>
    );
}
