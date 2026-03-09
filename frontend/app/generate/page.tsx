"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";


export default function GeneratePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const reuseId = searchParams.get("reuse");

    const [productDesc, setProductDesc] = useState("");
    const [target, setTarget] = useState("");
    const [tone, setTone] = useState("친근");

    useEffect(() => {
        if (!reuseId) return;

        async function fetchReuseData() {
            try {
                const data: any = await apiFetch(`/api/history/${reuseId}`);

                console.log("reuse data =", data);
                console.log("reuse input_json =", data?.input_json);
                console.log("reuse input_json.target =", data?.input_json?.target);
                console.log("reuse rawInput =", data?.input_json?.input);
                console.log("reuse rawInput.target =", data?.input_json?.input?.target);
                console.log("reuse rawInput full =", JSON.stringify(data?.input_json?.input, null, 2));

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

                setProductDesc(mergedDesc);
                setTarget(input.target ?? "");
            } catch (e) {
                console.error("재사용 데이터 조회 실패", e);
            }
        }

        fetchReuseData();
    }, [reuseId]);

    async function generate() {
        console.log("generate payload =", {
            productDesc,
            target,
            tone,
        });
        const data = await apiFetch("/api/generate", {
            method: "POST",
            body: JSON.stringify({
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
                params: {
                    variant_count: 3,
                },
            }),
        });

        sessionStorage.setItem("generationResult", JSON.stringify(data));
        localStorage.setItem("target", target);
        localStorage.setItem("tone", tone);
        localStorage.setItem("product", productDesc);


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
