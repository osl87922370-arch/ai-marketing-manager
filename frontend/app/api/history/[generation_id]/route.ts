import { NextResponse } from "next/server";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ generation_id: string }> }
) {
    const { generation_id } = await params;

    const auth = req.headers.get("authorization") ?? "";

    const r = await fetch(`http://localhost:8000/ai/history/${generation_id}`, {
        headers: {
            Authorization: auth,
            accept: "application/json",
        },
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