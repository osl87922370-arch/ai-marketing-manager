"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Sparkles, TrendingUp, Zap, Settings } from "lucide-react";

const routes = [
  { name: "Trend Hub", icon: TrendingUp, href: "/dashboard" },
  { name: "Insight Engine", icon: Sparkles, href: "/upload" },
  { name: "Campaigns", icon: Zap, href: "/campaigns" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="h-screen w-64 bg-slate-950 text-white flex flex-col border-r border-slate-900 transition-all duration-300">
      <div className="p-6">
        <h1 className="text-2xl font-black bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent italic">
          InsightFlow.ai
        </h1>
        <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-semibold">Marketing Intelligence</p>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {routes.map((route) => {
          const isActive = pathname === route.href;
          return (
            <Link
              key={route.href}
              href={route.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group
                    ${isActive
                  ? "bg-violet-600/10 text-violet-400 border border-violet-500/20 shadow-[0_0_20px_rgba(139,92,246,0.1)]"
                  : "text-slate-400 hover:bg-slate-900/50 hover:text-slate-200"
                }`}
            >
              <route.icon size={20} className={isActive ? "text-violet-400" : "text-slate-500 group-hover:text-slate-300"} />
              {route.name}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-slate-900">
        <button className="flex items-center gap-3 px-4 py-3 text-sm text-slate-500 hover:text-slate-300 w-full transition-colors">
          <Settings size={20} />
          Settings
        </button>
      </div>
    </div>
  );
}
