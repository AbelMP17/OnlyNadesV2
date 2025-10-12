// src/components/Header.tsx
"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/context/ThemeContext";
import Image from "next/image";

export default function Header() {
  const { user, loading, signInGoogle, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header
      className={`sticky top-0 w-full border-b border-gray-600 backdrop-blur-[5px] ${theme === "light" ? "bg-gray-200/70" : ""} z-50`}
    >
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link
          href="/"
          className="relative font-bold text-lg flex justify-center items-center gap-1 group"
        >
          <Image
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
              <Link href="/profile" className={`text-sm ${theme === "light" ? "text-white bg-blue-700/70" : "text-neutral-300 bg-blue-400/20"} gap-2 px-3 py-1 nm-button border text-sm flex items-center-2 select-none  rounded-[50px]`}>
                <Image src="/user.webp" width={20} height={20} alt="icon" />
                {user.displayName ?? user.email}
              </Link>
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
