const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

export function getToken() {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token");
}

type ApiOk<T> = { ok: true; result: T };
type ApiErr = { ok: false; error: { code?: string; message: string; detail?: unknown } };
type ApiResponse<T> = ApiOk<T> | ApiErr;

function isFormData(v: unknown): v is FormData {
    return typeof FormData !== "undefined" && v instanceof FormData;
}

export async function apiFetch<T>(
    path: string,
    options: RequestInit & { json?: unknown } = {}
): Promise<T> {
    const headers = new Headers(options.headers || {});
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);

    // json 옵션을 주면 apiFetch가 body 구성까지 책임짐
    let body = options.body;

    if (options.json !== undefined) {
        body = JSON.stringify(options.json);
        headers.set("Content-Type", "application/json");
    } else {
        // body가 FormData면 Content-Type 건드리면 안 됨
        if (!isFormData(body) && body != null) {
            // body가 문자열(JSON)일 가능성이 높으니 Content-Type은 필요 시만
            // (현재는 AI라 JSON만 쓸거라 크게 중요하진 않음)
        }
    }

    const res = await fetch(`http://127.0.0.1:8000${path}`, {
        ...options,
        headers,
        body,
    });


    // 204 같은 응답 대응
    const text = await res.text();
    const maybeJson = text ? (() => { try { return JSON.parse(text); } catch { return null; } })() : null;

    // HTTP 레벨 에러
    if (!res.ok) {
        // 백엔드가 JSON 에러를 주면 그걸 우선
        if (maybeJson && typeof maybeJson === "object") {
            const msg =
                (maybeJson as any).error?.message ||
                (maybeJson as any).message ||
                text ||
                `HTTP ${res.status}`;
            throw new Error(msg);
        }
        throw new Error(text || `HTTP ${res.status}`);
    }

    // 앱 레벨 스키마 {ok:...} 처리

    if (maybeJson !== null) return maybeJson as T;
    return text as unknown as T;



    // 스키마가 아직 고정 전이면, 일단 JSON 그대로 반환
    if (maybeJson !== null) return maybeJson as T;

    // JSON이 아니면 텍스트 반환(이 경우는 거의 없게 만들 예정)
    return text as unknown as T;
}
export type GenerateResult = {
    headline: string;
    body: string;
    cta: string;
    hashtags: string[];
};

export async function generateCopy(input: string): Promise<GenerateResult> {
    return apiFetch<GenerateResult>("/ai/generate", {
        method: "POST",
        json: {
            task: "copy.generate",
            input: { topic: input },
        },
    });
}



