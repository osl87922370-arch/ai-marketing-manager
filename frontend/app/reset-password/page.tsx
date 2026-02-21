"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Status = "idle" | "ready" | "saving" | "success" | "error";

function parseHashParams(hash: string) {
    // hash: "#access_token=...&refresh_token=...&type=recovery&..."
    const h = hash.startsWith("#") ? hash.slice(1) : hash;
    const params = new URLSearchParams(h);
    return {
        access_token: params.get("access_token"),
        refresh_token: params.get("refresh_token"),
        type: params.get("type"),
        error: params.get("error"),
        error_code: params.get("error_code"),
        error_description: params.get("error_description"),
    };
}

export default function ResetPasswordPage() {
    const router = useRouter();

    const [status, setStatus] = useState<Status>("idle");
    const [message, setMessage] = useState<string>("");

    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");

    const canSubmit = useMemo(() => {
        if (status !== "ready") return false;
        if (!password || !confirm) return false;
        if (password.length < 8) return false;
        if (password !== confirm) return false;
        return true;
    }, [status, password, confirm]);

    useEffect(() => {
        // 1) URL hash에서 토큰 추출
        const { access_token, refresh_token, type, error, error_description } =
            parseHashParams(window.location.hash);

        // otp 만료/에러가 URL에 붙어서 들어오는 케이스 처리
        if (error) {
            setStatus("error");
            setMessage(decodeURIComponent(error_description || error));
            return;
        }

        // recovery 링크면 보통 type=recovery
        if (type !== "recovery") {
            // 그래도 access_token이 있으면 진행 가능
            if (!access_token || !refresh_token) {
                setStatus("error");
                setMessage("Reset link에 필요한 토큰이 없습니다. 새 recovery 메일을 다시 발급해서 즉시 클릭해 주세요.");
                return;
            }
        }

        if (!access_token || !refresh_token) {
            setStatus("error");
            setMessage("토큰이 없습니다. 새 recovery 메일을 다시 발급해서 즉시 클릭해 주세요.");
            return;
        }

        // 2) supabase 세션 세팅 (이게 되어야 updateUser(password)가 먹힘)
        (async () => {
            const { error: setErr } = await supabase.auth.setSession({
                access_token,
                refresh_token,
            });

            if (setErr) {
                setStatus("error");
                setMessage(`세션 설정 실패: ${setErr.message}`);
                return;
            }

            // URL에 토큰 남지 않게 hash 제거 (안전/깔끔)
            window.history.replaceState(null, "", "/reset-password");
            setStatus("ready");
            setMessage("새 비밀번호를 입력해 주세요.");
        })();
    }, []);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;

        setStatus("saving");
        setMessage("");

        const { error } = await supabase.auth.updateUser({ password });

        if (error) {
            setStatus("error");
            setMessage(`비밀번호 변경 실패: ${error.message}`);
            return;
        }

        setStatus("success");
        setMessage("비밀번호가 변경되었습니다. 이제 로그인 페이지로 이동해 로그인해 보세요.");
        // 필요하면 자동 이동
        setTimeout(() => router.push("/login"), 800);
    };

    return (
        <div style={{ padding: 40, maxWidth: 420 }}>
            <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
                비밀번호 재설정
            </h1>

            <p style={{ marginBottom: 16, color: "#555" }}>
                {message || "로딩 중..."}
            </p>

            {status === "ready" || status === "saving" || status === "success" ? (
                <form onSubmit={onSubmit}>
                    <div style={{ display: "grid", gap: 10 }}>
                        <label style={{ display: "grid", gap: 6 }}>
                            <span>새 비밀번호</span>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="8자 이상"
                                autoComplete="new-password"
                                style={{ padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
                                disabled={status === "saving" || status === "success"}
                            />
                        </label>

                        <label style={{ display: "grid", gap: 6 }}>
                            <span>새 비밀번호 확인</span>
                            <input
                                type="password"
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                                placeholder="동일하게 입력"
                                autoComplete="new-password"
                                style={{ padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
                                disabled={status === "saving" || status === "success"}
                            />
                        </label>

                        <button
                            type="submit"
                            disabled={!canSubmit || status === "saving" || status === "success"}
                            style={{
                                padding: 12,
                                borderRadius: 10,
                                border: "1px solid #222",
                                background: canSubmit ? "#111" : "#ddd",
                                color: canSubmit ? "#fff" : "#666",
                                cursor: canSubmit ? "pointer" : "not-allowed",
                            }}
                        >
                            {status === "saving" ? "저장 중..." : "비밀번호 저장"}
                        </button>
                    </div>
                </form>
            ) : null}

            {status === "error" ? (
                <div style={{ marginTop: 16 }}>
                    <div style={{ marginBottom: 8, color: "#b00020", fontWeight: 600 }}>
                        오류
                    </div>
                    <div style={{ color: "#b00020" }}>
                        {message || "알 수 없는 오류"}
                    </div>
                    <div style={{ marginTop: 12, color: "#555" }}>
                        해결 팁: Supabase 대시보드에서 <b>Reset password</b> 메일을 새로 발급하고,
                        메일 도착 후 <b>바로</b> 클릭하세요(otp_expired 방지).
                    </div>
                </div>
            ) : null}
        </div>
    );
}