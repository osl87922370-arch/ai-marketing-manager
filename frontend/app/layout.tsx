import "./globals.css";
import type { ReactNode } from "react";
import ClientLayout from "./ClientLayout";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-slate-50 min-h-screen">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}

