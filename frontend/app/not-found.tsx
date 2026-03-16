import Link from "next/link";

export default function NotFound() {
    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: 40,
                textAlign: "center",
            }}
        >
            <div style={{ fontSize: 72, fontWeight: 800, color: "#1a1a1a", lineHeight: 1 }}>
                404
            </div>
            <div style={{ fontSize: 20, fontWeight: 600, marginTop: 16, color: "#333" }}>
                페이지를 찾을 수 없습니다
            </div>
            <div style={{ fontSize: 14, color: "#888", marginTop: 8 }}>
                요청하신 주소가 존재하지 않거나 이동되었습니다.
            </div>
            <Link
                href="/generate"
                style={{
                    marginTop: 32,
                    display: "inline-block",
                    padding: "12px 28px",
                    background: "#1a1a1a",
                    color: "#fff",
                    borderRadius: 8,
                    fontWeight: 600,
                    fontSize: 14,
                    textDecoration: "none",
                }}
            >
                홈으로 돌아가기
            </Link>
        </div>
    );
}
