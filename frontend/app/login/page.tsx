
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";


type LoginResponse = {
    access_token: string;
    token_type?: string;
};

export default function LoginPage() {
    const router = useRouter();

    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");

    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>("");
    const [okMsg, setOkMsg] = useState<string>("");

    // 이미 토큰 있으면 바로 이동(원치 않으면 이 useEffect 블록 삭제)
    useEffect(() => {
        const token =
            typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
        if (token) router.replace("/generate");
    }, [router]);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setError("");
        setOkMsg("");

        if (!email.trim() || !password.trim()) {
            setError("이메일/비밀번호를 입력해줘.");
            return;
        }

        setLoading(true);
        try {

            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                setErrMsg(error.message);
                return;
            }

            console.log("session:", data.session);
            console.log("access_token:", data.session?.access_token);

            if (data.session?.access_token) {
                localStorage.setItem("access_token", data.session.access_token);
                localStorage.setItem("user_email", data.session.user.email ?? email);
            }


            // ✅ key 이름 반드시 "access_token"
            localStorage.setItem("access_token", data.access_token);
            localStorage.setItem("user_email", email);

            setOkMsg("로그인 성공! 이동 중...");
            router.push("/generate");
        } catch (err: any) {
            // apiFetch가 던지는 에러 형태 대비
            const msg =
                err?.detail ||
                err?.message ||
                (typeof err === "string" ? err : JSON.stringify(err));
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-slate-50 min-h-screen flex items-center justify-center px-4">
            <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-extrabold tracking-tight">로그인</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        이메일과 비밀번호로 로그인해줘.
                    </p>
                </div>

                <form onSubmit={onSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            이메일
                        </label>
                        <input
                            type="email"
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-200"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onInput={(e) =>
                                setEmail((e.target as HTMLInputElement).value)
                            }
                            autoComplete="email"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            비밀번호
                        </label>
                        <input
                            type="password"
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-200"
                            placeholder="비밀번호"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onInput={(e) =>
                                setPassword((e.target as HTMLInputElement).value)
                            }
                            autoComplete="current-password"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg border border-slate-300 py-2 font-semibold hover:bg-slate-50 disabled:opacity-60"
                    >
                        {loading ? "로그인 중..." : "로그인"}
                    </button>
                </form>

                {error ? (
                    <pre className="mt-4 text-sm text-red-600 whitespace-pre-wrap">
                        {error}
                    </pre>
                ) : null}

                {okMsg ? (
                    <div className="mt-4 text-sm text-green-700 font-medium">
                        {okMsg}
                    </div>
                ) : null}

                <div className="mt-6 text-xs text-slate-500 leading-relaxed">
                    저장 확인: DevTools Console에서
                    <div className="mt-2 font-mono text-[11px] bg-slate-50 border border-slate-200 rounded-lg p-2">
                        localStorage.getItem("user_email"){"\n"}
                        localStorage.getItem("access_token")
                    </div>
                </div>
            </div>
        </div>
    );
}

