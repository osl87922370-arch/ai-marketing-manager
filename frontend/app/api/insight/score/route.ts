import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = "http://127.0.0.1:8000/api/insight/score";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const backendRes = await fetch(BACKEND_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        if (!backendRes.ok) {
            const err = await backendRes.text();
            return NextResponse.json(
                { error: "Backend failed", detail: err },
                { status: backendRes.status }
            );
        }

        const data = await backendRes.json();
        return NextResponse.json(data);
    } catch (e: any) {
        return NextResponse.json(
            { error: "Proxy error", detail: e?.message ?? String(e) },
            { status: 500 }
        );
    }
}
