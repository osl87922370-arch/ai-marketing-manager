
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";


type LoginResponse = {
    access_token: string;
    token_type?: string;
};

export default function LoginPage() {

    const router = useRouter();

    useEffect(() => {
        console.log("LOGIN PAGE ENV URL =", process.env.NEXT_PUBLIC_SUPABASE_URL);
        console.log(
            "LOGIN PAGE ENV KEY =",
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 20)
        );
    }, []);


    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");

    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>("");
    const [okMsg, setOkMsg] = useState<string>("");
    const handleSendResetEmail = async () => {
        setError("");
        setOkMsg("");

        if (!email) {
            setError("이메일을 먼저 입력하세요.");
            return;
        }

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: "http://localhost:3000/reset-password",
        });

        if (error) {
            console.log("[reset-email] error:", error);
            setError(`재설정 메일 발송 실패: ${error.message}`);

            return;
        }

        setOkMsg("재설정 메일을 보냈습니다. 최신 메일만 클릭하세요.");
    };


    // 이미 로그인된 세션이 있으면 바로 이동
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) router.replace("/generate");
        });
    }, [router]);

    const onSubmit = async (e: React.FormEvent) => {
        console.log("✅ onSubmit fired", Date.now());
        e.preventDefault();

        setError("");
        setOkMsg("");
        setLoading(true);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password: password.trim(),
            });

            if (error) {
                console.error("LOGIN ERROR:", error.message);
                setError(error.message);
                setLoading(false);
                return; // ✅ 여기서 끝
            }

            console.log("✅ LOGIN SUCCESS");

            setLoading(false);
            router.replace("/generate");
            return; // ✅ 성공 후에도 끝 (아래 중복 코드 실행 방지)
        } catch (err: any) {
            console.error("LOGIN EXCEPTION:", err?.message ?? err);
            setError(err?.message ?? "Unknown error");
            setLoading(false);
            return;
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

                    <div className="mt-3">
                        <button
                            type="button"
                            onClick={handleSendResetEmail}
                            className="w-full text-sm text-blue-600 hover:underline"
                        >
                            비밀번호를 잊으셨나요? 재설정 메일 보내기
                        </button>
                    </div>
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

                <div className="mt-6 text-center text-sm text-slate-500">
                    계정이 없으신가요?{" "}
                    <Link href="/signup" className="text-blue-600 hover:underline font-medium">
                        회원가입
                    </Link>
                </div>
            </div>
        </div>
    );
}

