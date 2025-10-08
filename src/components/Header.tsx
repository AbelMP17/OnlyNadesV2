// src/components/Header.tsx
"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/context/ThemeContext";

export default function Header() {
  const { user, loading, signInGoogle, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header
      className={`w-full border-b border-gray-600 ${theme === "light" ? "bg-transparent" : ""}`}
    >
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link
          href="/"
          className="relative font-bold text-lg flex justify-center items-center gap-1 group"
        >
          <img
            src={theme === "light" ? "https://res.cloudinary.com/dursdihyg/image/upload/v1759516510/home_orwgbc.png" : "https://res.cloudinary.com/dursdihyg/image/upload/v1759516511/home_w_gzy3mw.png"}
            alt="home"
            className="w-[20px] h-[20px] absolute opacity-0 group-hover:opacity-100 left-0"
          />
          <p className="group-hover:ml-6 group-hover:tracking-tighter">OnlyNades</p>
        </Link>

        <nav className="flex items-center gap-4">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="theme-toggle-btn"
            title="Alternar tema"
            aria-label="Alternar tema"
            aria-pressed={theme === "light"}
          >
            {theme === "dark" ? "🌙 Dark" : "🔆 Light"}
          </button>

          {loading ? (
            <span className="text-sm text-neutral-500">Cargando…</span>
          ) : user ? (
            <div className="flex items-center gap-3">
              <span className={`text-sm ${theme === "light" ? "text-neutral-900" : "text-neutral-300"} select-none`}>
                {user.displayName ?? user.email}
              </span>
              <button
                onClick={logout}
                className="px-3 py-1 rounded border text-sm hover:bg-red-300 hover:border-white hover:text-black"
              >
                Salir
              </button>
            </div>
          ) : (
            <button
              onClick={signInGoogle}
              className="px-3 py-2 rounded bg-black text-white text-sm hover:bg-gray-300 border border-white hover:text-black"
            >
              Entrar con Google
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
