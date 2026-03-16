"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function ClientLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);

    const hideSidebar = pathname === "/login" || pathname === "/";

    if (hideSidebar) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                {children}
            </div>
        );
    }

    return (
        <div className="min-h-screen flex">
            {/* 데스크탑: 항상 표시 */}
            <div className="hidden md:block">
                <Sidebar />
            </div>

            <div className="flex-1 flex flex-col min-w-0">
                {/* 모바일 상단 바 */}
                <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-[#0b1020] text-white">
                    <Sheet open={open} onOpenChange={setOpen}>
                        <SheetTrigger asChild>
                            <button className="p-1 rounded hover:bg-white/10 transition" aria-label="메뉴 열기">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="3" y1="6" x2="21" y2="6" />
                                    <line x1="3" y1="12" x2="21" y2="12" />
                                    <line x1="3" y1="18" x2="21" y2="18" />
                                </svg>
                            </button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 w-[260px] bg-[#0b1020] border-r-0">
                            <Sidebar onClose={() => setOpen(false)} />
                        </SheetContent>
                    </Sheet>
                    <span className="font-bold text-sm tracking-tight">InsightFlow.ai</span>
                </div>

                {/* 메인 콘텐츠 */}
                <main className="flex-1 overflow-auto">{children}</main>
            </div>
        </div>
    );
}
