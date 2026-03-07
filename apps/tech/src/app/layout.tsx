import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/app/components/ui/Sidebar";
import QueryProvider from "@/providers/QueryProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EBOSS Tech App",
  description: "EBOSS Tech App",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-slate-50 dark:bg-slate-950`}>
        <QueryProvider>
          <div className="flex">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content */}
            {/* Main Content - Full Width for Industrial Dashboard */}
            <main className="flex-1 overflow-hidden bg-slate-950">
              {children}
            </main>
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}
