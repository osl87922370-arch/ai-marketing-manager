"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

type AuthContextType = {
    user: User | null;
    session: Session | null;
    loading: boolean;
    plan: "basic" | "pro";
};

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    loading: true,
    plan: "basic",
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [plan, setPlan] = useState<"basic" | "pro">("basic");

    async function fetchPlan(accessToken: string) {
        try {
            const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";
            const res = await fetch(`${API_BASE}/ai/me`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (res.ok) {
                const data = await res.json();
                setPlan(data.plan === "pro" ? "pro" : "basic");
            }
        } catch {
            // 네트워크 오류 시 기본값 유지
        }
    }

    useEffect(() => {
        // 초기 세션 로드
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
            if (session?.access_token) {
                fetchPlan(session.access_token);
            }
        });

        // 세션 변경 감지 (로그인/로그아웃/토큰 갱신)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
            if (session?.access_token) {
                fetchPlan(session.access_token);
            } else {
                setPlan("basic");
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user, session, loading, plan }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
