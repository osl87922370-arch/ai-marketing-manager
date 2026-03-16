"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const items = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/generate", label: "Generate" },
  { href: "/history", label: "History" },
  { href: "/result", label: "Result" },
  { href: "/upload", label: "Upload" },
  { href: "/cardnews", label: "Card News" },
];

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

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
          {items.map((it) => {
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
