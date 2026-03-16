"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [okMsg, setOkMsg] = useState("");

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setOkMsg("");

        if (password !== passwordConfirm) {
            setError("비밀번호가 일치하지 않습니다.");
            return;
        }
        if (password.length < 6) {
            setError("비밀번호는 6자 이상이어야 합니다.");
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.signUp({
                email: email.trim(),
                password: password.trim(),
            });

            if (error) {
                setError(error.message);
                return;
            }

            setOkMsg("가입 확인 메일을 보냈습니다. 이메일을 확인해주세요.");
        } catch (err: any) {
            setError(err?.message ?? "Unknown error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-slate-50 min-h-screen flex items-center justify-center px-4">
            <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-extrabold tracking-tight">회원가입</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        InsightFlow.ai에 오신 것을 환영합니다.
                    </p>
                </div>

                <form onSubmit={onSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">이메일</label>
                        <input
                            type="email"
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-200"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="email"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">비밀번호</label>
                        <input
                            type="password"
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-200"
                            placeholder="6자 이상"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="new-password"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">비밀번호 확인</label>
                        <input
                            type="password"
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-200"
                            placeholder="비밀번호 재입력"
                            value={passwordConfirm}
                            onChange={(e) => setPasswordConfirm(e.target.value)}
                            autoComplete="new-password"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !!okMsg}
                        className="w-full rounded-lg border border-slate-300 py-2 font-semibold hover:bg-slate-50 disabled:opacity-60"
                    >
                        {loading ? "가입 중..." : "회원가입"}
                    </button>
                </form>

                {error && (
                    <pre className="mt-4 text-sm text-red-600 whitespace-pre-wrap">{error}</pre>
                )}

                {okMsg && (
                    <div className="mt-4 text-sm text-green-700 font-medium">{okMsg}</div>
                )}

                {okMsg && (
                    <button
                        onClick={() => router.replace("/login")}
                        className="mt-3 w-full rounded-lg border border-slate-300 py-2 text-sm font-semibold hover:bg-slate-50"
                    >
                        로그인 페이지로 이동
                    </button>
                )}

                <div className="mt-6 text-center text-sm text-slate-500">
                    이미 계정이 있으신가요?{" "}
                    <Link href="/login" className="text-blue-600 hover:underline font-medium">
                        로그인
                    </Link>
                </div>
            </div>
        </div>
    );
}
