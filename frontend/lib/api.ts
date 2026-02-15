const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

export function getToken() {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token");
}

export async function apiFetch(path: string, options: RequestInit = {}) {
    const headers = new Headers(options.headers || {});
    headers.set("Content-Type", "application/json");

    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);

    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers,
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
    }

    return res.json();
}
