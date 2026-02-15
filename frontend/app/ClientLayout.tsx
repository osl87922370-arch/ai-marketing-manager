"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export default function ClientLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();

    // 로그인/루트에서는 사이드바 없이 가운데 정렬
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
            <Sidebar />
            <main className="flex-1 overflow-auto">{children}</main>
        </div>
    );
}
