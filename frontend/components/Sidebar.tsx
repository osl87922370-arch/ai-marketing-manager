"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();

  const items = [
    { href: "/generate", label: "Generate" },
    { href: "/history", label: "History" },
    { href: "/result", label: "Result" },
    { href: "/upload", label: "Upload" },
  ];

  return (
    <aside className="w-[260px] min-h-screen border-r bg-[#0b1020] text-white">
      <div className="p-6">
        <div className="text-xl font-extrabold tracking-tight">InsightFlow.ai</div>
        <div className="mt-1 text-xs opacity-70">MARKETING INTELLIGENCE</div>

        <nav className="mt-10 space-y-2">
          {items.map((it) => {
            const active = pathname === it.href;
            return (
              <Link
                key={it.href}
                href={it.href}
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
    </aside>
  );
}

