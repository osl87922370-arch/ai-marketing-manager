"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { Lock } from "lucide-react";

const basicItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/generate", label: "Generate" },
  { href: "/history", label: "History" },
  { href: "/result", label: "Result" },
  { href: "/upload", label: "Upload" },
  { href: "/cardnews", label: "Card News" },
];

const proItems = [
  { href: "/utm", label: "UTM 관리" },
  { href: "/ga-dashboard", label: "GA 대시보드" },
  { href: "/performance", label: "성과 비교" },
];

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { plan } = useAuth();

  const isProUser = plan === "pro";

  async function handleLogout() {
    await supabase.auth.signOut();
    onClose?.();
    router.replace("/login");
  }

  return (
    <aside className="w-[260px] min-h-screen border-r bg-[#0b1020] text-white flex flex-col">
      <div className="p-6 flex-1">
        <div className="text-xl font-extrabold tracking-tight">InsightFlow.ai</div>
        <div className="mt-1 text-xs opacity-70">MARKETING INTELLIGENCE</div>

        <nav className="mt-10 space-y-2">
          {basicItems.map((it) => {
            const active = pathname === it.href;
            return (
              <Link
                key={it.href}
                href={it.href}
                onClick={onClose}
                className={[
                  "block rounded-lg px-3 py-2 text-sm transition",
                  active ? "bg-white/10" : "hover:bg-white/10",
                ].join(" ")}
              >
                {it.label}
              </Link>
            );
          })}

          {/* PRO 구분선 */}
          <div className="pt-4 pb-2">
            <div className="flex items-center gap-2">
              <div className="flex-1 border-t border-white/20" />
              <span className="text-[10px] font-bold text-cyan-400 tracking-wider">PRO</span>
              <div className="flex-1 border-t border-white/20" />
            </div>
          </div>

          {proItems.map((it) => {
            const active = pathname === it.href;

            if (isProUser) {
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  onClick={onClose}
                  className={[
                    "block rounded-lg px-3 py-2 text-sm transition",
                    active ? "bg-white/10" : "hover:bg-white/10",
                  ].join(" ")}
                >
                  {it.label}
                </Link>
              );
            }

            return (
              <button
                key={it.href}
                onClick={() => alert("프로 전용 기능입니다. 플랜 업그레이드가 필요합니다.")}
                className="w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm text-white/40 cursor-not-allowed"
              >
                <span>{it.label}</span>
                <Lock size={14} className="text-white/30" />
              </button>
            );
          })}
        </nav>
      </div>

      {/* 로그아웃 버튼 */}
      <div className="p-6 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="w-full rounded-lg px-3 py-2 text-sm text-left text-white/60 hover:bg-white/10 hover:text-white transition"
        >
          로그아웃
        </button>
      </div>
    </aside>
  );
}
