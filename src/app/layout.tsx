// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { AuthProvider } from "@/lib/auth";
import Header from "@/components/Header";
import { ThemeProvider } from "@/context/ThemeContext"; // <-- nuevo

export const metadata: Metadata = {
  title: "OnlyNades",
  description: "Best nades in CS2",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="cs-page min-h-screen">
        <ThemeProvider>
          <AuthProvider>
            <Header />
            <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
