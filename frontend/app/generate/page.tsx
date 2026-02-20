
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function LoginPage() {
    const router = useRouter()

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    const handleLogin = async () => {
        setError("")
        setLoading(true)

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) {
                setError(error.message)
                return
            }

            const accessToken = data.session?.access_token
            if (!accessToken) {
                setError("토큰이 발급되지 않았습니다")
                return
            }

            // 기존 코드가 localStorage에서 access_token을 읽는 구조라면 유지
            localStorage.setItem("access_token", accessToken)
            localStorage.setItem("user_email", email)

            // 이미 /generate 페이지라면 refresh가 더 깔끔
            router.refresh()
            // 다른 페이지로 보내고 싶으면 아래처럼:
            // router.push("/history")
        } catch (e: any) {
            setError(e?.message ?? "로그인 중 오류가 발생했습니다")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-8 max-w-sm mx-auto">
            <h1 className="text-2xl font-bold mb-4">로그인</h1>

            <input
                type="email"
                placeholder="이메일"
                className="border p-2 w-full mb-3"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />

            <input
                type="password"
                placeholder="비밀번호"
                className="border p-2 w-full mb-3"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />

            <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full border p-2"
            >
                {loading ? "로그인 중..." : "로그인"}
            </button>

            {error ? <p className="text-red-500 mt-3">{error}</p> : null}
        </div>
    )
}
