import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const auth = req.headers.get("authorization") ?? "";
    const body = await req.text();

    const r = await fetch("http://127.0.0.1:8000/ai/results", {
        method: "POST",
        headers: {
            Authorization: auth,
            "Content-Type": "application/json",
            accept: "application/json",
        },
        body,
        cache: "no-store",
    });

    const text = await r.text();

    return new NextResponse(text, {
        status: r.status,
        headers: {
            "Content-Type": r.headers.get("content-type") ?? "application/json",
        },
    });
}