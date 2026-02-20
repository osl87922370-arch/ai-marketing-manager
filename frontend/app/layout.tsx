import "./globals.css";
import type { ReactNode } from "react";
import ClientLayout from "./ClientLayout";
import Providers from "./providers";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-slate-50 min-h-screen">
        <Providers>
          <ClientLayout>{children}</ClientLayout>
        </Providers>
      </body>
    </html>
  );
}

