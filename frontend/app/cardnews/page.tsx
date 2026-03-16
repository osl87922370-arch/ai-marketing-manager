"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Variant = {
    headline?: string;
    body?: string;
    cta?: string;
    hashtags?: string[] | string;
};

const THEMES = [
    { label: "다크", bg: "#1a1a2e", text: "#ffffff", accent: "#e94560", sub: "rgba(255,255,255,0.75)" },
    { label: "라이트", bg: "#ffffff", text: "#1a1a1a", accent: "#1a6fa8", sub: "#555555" },
    { label: "그라데이션", bg: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", text: "#ffffff", accent: "#ffd700", sub: "rgba(255,255,255,0.85)" },
    { label: "민트", bg: "#e8f8f5", text: "#1a3a2e", accent: "#27ae60", sub: "#555555" },
    { label: "오렌지", bg: "#fff3e0", text: "#3e2723", accent: "#e65100", sub: "#555555" },
];

const KOREAN_FONT = "'Noto Sans KR', Arial, sans-serif";
const KOREAN_FONT_BOLD = "bold 'Noto Sans KR', Arial, sans-serif";

async function loadKoreanFont(): Promise<void> {
    if (document.fonts.check("12px 'Noto Sans KR'")) return;
    try {
        const font = new FontFace(
            "Noto Sans KR",
            "url(https://fonts.gstatic.com/s/notosanskr/v36/PbyxFmXiEBPT4ITbgNA5Cgms3VYcOA-vvnIzzuoyeLTq8H4hfeE.woff2) format('woff2')",
            { weight: "400 700" }
        );
        const loaded = await font.load();
        document.fonts.add(loaded);
        await document.fonts.ready;
    } catch {
        // 폰트 로드 실패 시 기본 폰트 사용
    }
}

export default function CardNewsPage() {
    const router = useRouter();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [variants, setVariants] = useState<Variant[]>([]);
    const [variantIndex, setVariantIndex] = useState(0);
    const variant = variants[variantIndex] ?? null;
    const [themeIndex, setThemeIndex] = useState(0);
    const [downloading, setDownloading] = useState(false);
    const [fontReady, setFontReady] = useState(false);

    useEffect(() => {
        loadKoreanFont().then(() => setFontReady(true));
    }, []);

    useEffect(() => {
        const raw = sessionStorage.getItem("generationResult");
        if (!raw) { router.replace("/generate"); return; }
        try {
            const parsed = JSON.parse(raw);
            const loaded: Variant[] = parsed?.generation?.output?.variants || [];
            if (loaded.length === 0) { router.replace("/generate"); return; }
            const selectedIndex = parseInt(sessionStorage.getItem("selectedVariantIndex") || "0", 10);
            setVariants(loaded);
            setVariantIndex(Math.min(selectedIndex, loaded.length - 1));
        } catch { router.replace("/generate"); }
    }, [router]);

    useEffect(() => {
        if (variant && fontReady) drawCanvas();
    }, [variant, themeIndex, fontReady]);

    function getHashtags(): string {
        if (!variant?.hashtags) return "";
        if (Array.isArray(variant.hashtags)) return variant.hashtags.join(" ");
        return variant.hashtags;
    }

    function drawCanvas() {
        const canvas = canvasRef.current;
        if (!canvas || !variant) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const size = 1080;
        canvas.width = size;
        canvas.height = size;

        const theme = THEMES[themeIndex];

        // 배경
        if (theme.bg.startsWith("linear-gradient")) {
            const grad = ctx.createLinearGradient(0, 0, size, size);
            grad.addColorStop(0, "#667eea");
            grad.addColorStop(1, "#764ba2");
            ctx.fillStyle = grad;
        } else {
            ctx.fillStyle = theme.bg;
        }
        ctx.fillRect(0, 0, size, size);

        // 상단 브랜드 바
        ctx.fillStyle = theme.accent;
        ctx.fillRect(0, 0, size, 8);

        // 브랜드 로고
        ctx.fillStyle = theme.accent;
        ctx.font = `bold 28px ${KOREAN_FONT}`;
        ctx.fillText("InsightFlow.ai", 60, 70);

        // 구분선
        ctx.strokeStyle = theme.accent;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(60, 90);
        ctx.lineTo(size - 60, 90);
        ctx.stroke();

        // Headline
        ctx.fillStyle = theme.text;
        ctx.font = `bold 72px ${KOREAN_FONT}`;
        const headline = variant.headline || "";
        wrapText(ctx, headline, 60, 200, size - 120, 90);

        // Body
        ctx.fillStyle = theme.sub;
        ctx.font = `38px ${KOREAN_FONT}`;
        const body = variant.body || "";
        wrapText(ctx, body, 60, 420, size - 120, 52);

        // CTA 버튼 스타일
        if (variant.cta) {
            const ctaY = 680;
            ctx.fillStyle = theme.accent;
            roundRect(ctx, 60, ctaY, 380, 70, 12);
            ctx.fillStyle = "#ffffff";
            ctx.font = `bold 32px ${KOREAN_FONT}`;
            ctx.fillText(`→ ${variant.cta}`, 80, ctaY + 46);
        }

        // Hashtags
        const hashtags = getHashtags();
        if (hashtags) {
            ctx.fillStyle = theme.accent;
            ctx.font = `28px ${KOREAN_FONT}`;
            wrapText(ctx, hashtags, 60, 800, size - 120, 40);
        }

        // 하단 워터마크
        ctx.fillStyle = theme.sub;
        ctx.font = `24px ${KOREAN_FONT}`;
        ctx.fillText("AI 마케팅 카피 생성 by InsightFlow.ai", 60, size - 40);
    }

    function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
        const words = text.split(" ");
        let line = "";
        let currentY = y;
        for (let i = 0; i < words.length; i++) {
            const testLine = line + words[i] + " ";
            if (ctx.measureText(testLine).width > maxWidth && i > 0) {
                ctx.fillText(line, x, currentY);
                line = words[i] + " ";
                currentY += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, currentY);
    }

    function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
        ctx.fill();
    }

    function handleDownload() {
        const canvas = canvasRef.current;
        if (!canvas) return;
        setDownloading(true);
        const link = document.createElement("a");
        link.download = `cardnews_${Date.now()}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
        setDownloading(false);
    }

    if (!variant) return <div style={{ padding: 40 }}>로딩 중...</div>;

    return (
        <div style={{ padding: 40, maxWidth: 900 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
                <button
                    onClick={() => router.back()}
                    style={{ padding: "8px 16px", border: "1px solid #ddd", borderRadius: 8, cursor: "pointer", background: "#fff" }}
                >
                    ← 돌아가기
                </button>
                <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>카드뉴스 만들기</h1>
            </div>

            {/* 카피 선택 (variant가 여러 개일 때만 표시) */}
            {variants.length > 1 && (
                <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>카피 선택</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {variants.map((v, i) => (
                            <button
                                key={i}
                                onClick={() => setVariantIndex(i)}
                                style={{
                                    padding: "8px 16px",
                                    borderRadius: 8,
                                    border: variantIndex === i ? "2px solid #1a1a1a" : "1px solid #ddd",
                                    background: variantIndex === i ? "#1a1a1a" : "#fff",
                                    color: variantIndex === i ? "#fff" : "#555",
                                    cursor: "pointer",
                                    fontWeight: variantIndex === i ? 700 : 400,
                                    fontSize: 13,
                                }}
                            >
                                카피 {i + 1}
                                {v.headline && (
                                    <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.75 }}>
                                        {v.headline.slice(0, 10)}{v.headline.length > 10 ? "…" : ""}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* 테마 선택 */}
            <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>테마 선택</div>
                <div style={{ display: "flex", gap: 10 }}>
                    {THEMES.map((t, i) => (
                        <button
                            key={i}
                            onClick={() => setThemeIndex(i)}
                            style={{
                                padding: "8px 16px",
                                borderRadius: 8,
                                border: themeIndex === i ? "2px solid #1a1a1a" : "1px solid #ddd",
                                background: t.bg.startsWith("linear") ? "linear-gradient(135deg, #667eea, #764ba2)" : t.bg,
                                color: t.text,
                                cursor: "pointer",
                                fontWeight: themeIndex === i ? 700 : 400,
                                fontSize: 14,
                            }}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* 캔버스 미리보기 */}
            <div style={{ marginBottom: 20, border: "1px solid #ddd", borderRadius: 12, overflow: "hidden", display: "inline-block" }}>
                <canvas
                    ref={canvasRef}
                    style={{ width: "100%", maxWidth: 540, display: "block" }}
                />
            </div>

            {/* 카피 내용 확인 */}
            <div style={{ background: "#f8f8f8", borderRadius: 8, padding: 16, marginBottom: 20, fontSize: 14 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>카피 내용</div>
                <div><strong>헤드라인:</strong> {variant.headline}</div>
                <div style={{ marginTop: 4 }}><strong>본문:</strong> {variant.body}</div>
                {variant.cta && <div style={{ marginTop: 4 }}><strong>CTA:</strong> {variant.cta}</div>}
                {variant.hashtags && <div style={{ marginTop: 4 }}><strong>해시태그:</strong> {getHashtags()}</div>}
            </div>

            {/* 다운로드 버튼 */}
            <button
                onClick={handleDownload}
                disabled={downloading}
                style={{
                    width: "100%",
                    padding: "16px",
                    background: "#1a1a1a",
                    color: "#fff",
                    border: "none",
                    borderRadius: 10,
                    fontSize: 16,
                    fontWeight: 700,
                    cursor: "pointer",
                    opacity: downloading ? 0.6 : 1,
                }}
            >
                {downloading ? "다운로드 중..." : "PNG 다운로드"}
            </button>
        </div>
    );
}
