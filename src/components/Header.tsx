// src/components/Header.tsx
"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/context/ThemeContext";
import Image from "next/image";
import { useState } from "react";

export default function Header() {
  const { user, loading, signInGoogle, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <header
      className={`sticky top-0 w-full border-b border-gray-600 backdrop-blur-[5px] ${theme === "light" ? "bg-gray-200/70" : ""} z-50`}
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

        {/* Desktop nav: oculto en móviles */}
        <nav className="hidden md:flex items-center gap-4">
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
              <Link href="/profile" className={`text-sm ${theme === "light" ? "text-white bg-blue-700/70" : "text-neutral-300 bg-blue-400/20"} gap-2 px-3 py-1 nm-button border text-sm flex items-center-2 select-none rounded-[50px]`}>
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

        {/* Mobile controls */}
        <div className="md:hidden flex items-center gap-2">
          <button
            onClick={toggleTheme}
            title="Alternar tema"
            aria-label="Alternar tema"
            aria-pressed={theme === "light"}
          >
            {theme === "dark" ? "🌙" : "🔆"}
          </button>

          <button
            onClick={() => setOpen((s) => !s)}
            aria-expanded={open}
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            className="p-2 rounded-md"
          >
            {open ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M3 12h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3 6h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile panel */}
      <div
        className={`md:hidden transition-[max-height,opacity] duration-200 ease-in-out overflow-hidden ${open ? "max-h-[420px] opacity-100" : "max-h-0 opacity-0"}`}
      >
        <div className={`px-4 pb-4 pt-2 space-y-3 ${theme === "light" ? "bg-gray-200/60 border-t border-gray-300" : "bg-neutral-900/80 border-t border-neutral-800"}`}>
          <div className="flex flex-col gap-2">
            <Link href="/profile" className="px-3 py-2 rounded-md nm-button text-sm">Mi perfil</Link>

            <div className="pt-1 border-t border-neutral-700/30"></div>

            {loading ? null : user ? (
              <>
                <button onClick={logout} className="w-full text-left px-3 py-2 rounded-md border nm-button text-sm">Salir</button>
              </>
            ) : (
              <button onClick={signInGoogle} className="w-full px-3 py-2 rounded-md bg-black text-white text-sm">Entrar con Google</button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
