"use client";

import { useEffect } from "react";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("[GlobalError]", error);
    }, [error]);

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: 40,
                textAlign: "center",
            }}
        >
            <div style={{ fontSize: 72, fontWeight: 800, color: "#1a1a1a", lineHeight: 1 }}>
                500
            </div>
            <div style={{ fontSize: 20, fontWeight: 600, marginTop: 16, color: "#333" }}>
                서버 오류가 발생했습니다
            </div>
            <div style={{ fontSize: 14, color: "#888", marginTop: 8 }}>
                일시적인 오류입니다. 잠시 후 다시 시도해 주세요.
            </div>
            {error?.digest && (
                <div style={{ fontSize: 12, color: "#bbb", marginTop: 6 }}>
                    오류 코드: {error.digest}
                </div>
            )}
            <div style={{ display: "flex", gap: 12, marginTop: 32 }}>
                <button
                    onClick={reset}
                    style={{
                        padding: "12px 28px",
                        background: "#1a1a1a",
                        color: "#fff",
                        border: "none",
                        borderRadius: 8,
                        fontWeight: 600,
                        fontSize: 14,
                        cursor: "pointer",
                    }}
                >
                    다시 시도
                </button>
                <a
                    href="/generate"
                    style={{
                        padding: "12px 28px",
                        background: "#fff",
                        color: "#333",
                        border: "1px solid #ddd",
                        borderRadius: 8,
                        fontWeight: 600,
                        fontSize: 14,
                        textDecoration: "none",
                    }}
                >
                    홈으로
                </a>
            </div>
        </div>
    );
}
