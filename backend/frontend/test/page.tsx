"use client";

import { generateCopy } from "@/lib/api";
import { useState } from "react";

export default function TestPage() {
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const res = await generateCopy("카페 할인 이벤트");
            setResult(res);
        } catch (e: any) {
            alert(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: 40 }}>
            <button onClick={handleGenerate}>
                {loading ? "생성 중..." : "AI 생성 테스트"}
            </button>

            {result && (
                <pre style={{ marginTop: 20 }}>
                    {JSON.stringify(result, null, 2)}
                </pre>
            )}
        </div>
    );
}
