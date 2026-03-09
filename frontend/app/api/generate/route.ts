import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const auth = req.headers.get("authorization") ?? "";
    const bodyText = await req.text();

    const r = await fetch("http://localhost:8000/ai/generate", {
        method: "POST",
        headers: {
            Authorization: auth,
            accept: "application/json",
            "content-type": "application/json",
        },
        body: bodyText,
        cache: "no-store",
    });

    const text = await r.text();

    return new NextResponse(text, {
        status: r.status,
        headers: {
            "content-type": r.headers.get("content-type") ?? "application/json",
        },
    });
}