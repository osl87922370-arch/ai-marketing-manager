const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

export function getToken() {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("access_token");
}





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

    const url = path.startsWith("/api/") ? path : `${API_BASE}${path}`;

    const res = await fetch(url, {
        ...options,
        headers,
        body,
    });


    // 🔐 인증 만료/무효 토큰 공통 처리

    if (res.status === 401) {
        if (typeof window !== "undefined") {
            localStorage.removeItem("access_token");
            localStorage.removeItem("user_email");
            window.location.href = "/login";
        }

        throw new Error("세션이 만료되었습니다. 다시 로그인해 주세요.");
    }

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



