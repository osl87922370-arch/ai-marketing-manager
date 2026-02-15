"use client";

export default function ResultPage() {
    const data =
        typeof window !== "undefined"
            ? JSON.parse(sessionStorage.getItem("result") || "{}")
            : null;

    return (
        <div style={{ padding: 40 }}>
            <h1>결과</h1>

            <textarea
                value={data?.result_text || ""}
                rows={12}
                style={{ width: "100%" }}
                readOnly
            />
        </div>
    );
}
