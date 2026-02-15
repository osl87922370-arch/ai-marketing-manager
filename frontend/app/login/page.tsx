"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

export default function LoginPage() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function login() {
        console.log("LOGIN CLICKED");
        setError(null);
        setLoading(true);

        try {
            const data = await apiFetch("/api/auth/login", {
                method: "POST",
                body: JSON.stringify({ email, password }),
            });

            localStorage.setItem("token", data.access_token);
            router.push("/generate");
        } catch (e: any) {
            console.error(e);
            setError(e?.message || "로그인 실패");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ padding: 40, maxWidth: 400 }}>
            <h1>로그인</h1>

            <div>
                <input
                    placeholder="이메일"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ width: "100%", padding: 8, marginBottom: 8 }}
                />
            </div>

            <div>
                <input
                    type="password"
                    placeholder="비밀번호"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ width: "100%", padding: 8, marginBottom: 12 }}
                />
            </div>

            <button onClick={login} disabled={loading}>
                {loading ? "로그인 중..." : "로그인"}
            </button>

            {error && (
                <div style={{ color: "red", marginTop: 12, whiteSpace: "pre-wrap" }}>
                    {error}
                </div>
            )}
        </div>
    );
}
