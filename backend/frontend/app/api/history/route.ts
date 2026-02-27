import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const url = new URL(req.url);
    const limit = url.searchParams.get("limit") ?? "20";
    const cursor = url.searchParams.get("cursor");

    const backend = new URL("http://localhost:8000/ai/history");
    backend.searchParams.set("limit", limit);
    if (cursor) backend.searchParams.set("cursor", cursor);

    const auth = req.headers.get("authorization") ?? "";

    const r = await fetch(backend.toString(), {
        headers: { Authorization: auth },
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
