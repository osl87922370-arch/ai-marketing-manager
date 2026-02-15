"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

export default function GeneratePage() {
    const router = useRouter();

    const [productDesc, setProductDesc] = useState("");
    const [target, setTarget] = useState("");
    const [tone, setTone] = useState("친근");

    async function generate() {
        const data = await apiFetch("/api/generate", {
            method: "POST",
            body: JSON.stringify({
                product_desc: productDesc,
                target,
                tone,
            }),
        });

        sessionStorage.setItem("result", JSON.stringify(data));
        router.push("/result");
    }

    return (
        <div style={{ padding: 40 }}>
            <h1>생성하기</h1>

            <textarea
                placeholder="상품 설명"
                value={productDesc}
                onChange={e => setProductDesc(e.target.value)}
            />

            <br />

            <input
                placeholder="타겟"
                value={target}
                onChange={e => setTarget(e.target.value)}
            />

            <br />

            <select value={tone} onChange={e => setTone(e.target.value)}>
                <option>친근</option>
                <option>전문</option>
                <option>유머</option>
                <option>하드셀</option>
            </select>

            <br />

            <button onClick={generate}>생성</button>
        </div>
    );
}
