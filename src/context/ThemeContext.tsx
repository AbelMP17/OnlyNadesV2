// src/context/ThemeContext.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  // inicializamos desde localStorage / prefers-color-scheme en el cliente
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("cs_theme");
    if (saved === "light" || saved === "dark") {
      setTheme(saved);
      // add/remove class right away
      if (saved === "light") document.documentElement.classList.add("light");
      else document.documentElement.classList.remove("light");
      return;
    }
    const prefersLight =
      window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
    const initial = prefersLight ? "light" : "dark";
    setTheme(initial);
    if (initial === "light") document.documentElement.classList.add("light");
    else document.documentElement.classList.remove("light");
  }, []);

  // cuando cambia el theme lo persistimos y actualizamos clase html
  useEffect(() => {
    if (typeof document !== "undefined") {
      if (theme === "light") document.documentElement.classList.add("light");
      else document.documentElement.classList.remove("light");
    }
    if (typeof window !== "undefined") localStorage.setItem("cs_theme", theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
