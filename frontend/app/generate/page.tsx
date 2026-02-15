"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
    const router = useRouter()

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")

    const handleLogin = async () => {
        setError("")

        const res = await fetch("http://127.0.0.1:8000/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email,
                password,
            }),
        })

        if (!res.ok) {
            const err = await res.json()
            setError(err.detail || "로그인 실패")
            return
        }

        const data = await res.json()

        localStorage.setItem("access_token", data.access_token)
        localStorage.setItem("user_email", email)

        router.push("/generate")
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
                className="bg-black text-white px-4 py-2 w-full"
            >
                로그인
            </button>

            {error && <p className="text-red-500 mt-3">{error}</p>}
        </div>
    )
}

