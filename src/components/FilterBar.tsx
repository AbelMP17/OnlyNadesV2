// src/components/FilterBar.tsx
"use client";

import React, { JSX } from "react";

const ICONS: Record<string, JSX.Element> = {
  smoke: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 18h8v2H4z" fill="currentColor" opacity="0.9" />
      <path d="M6 14h8v2H6z" fill="currentColor" opacity="0.7" />
      <path d="M8 10h6v2H8z" fill="currentColor" opacity="0.5" />
    </svg>
  ),
  flash: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M13 2L3 14h7l-1 8L21 10h-7l-1-8z" fill="currentColor" />
    </svg>
  ),
  molotov: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 2c0 2-2 4-2 4s2 2 2 4 2 2 2 4 2 2 2 4H6c0-4 6-6 6-12 0-2-2-4-2-4s2-2 2-4z" fill="currentColor" />
    </svg>
  ),
  he: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 8v4l2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  decoy: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="4" width="16" height="16" rx="3" fill="currentColor" opacity="0.12"/>
      <path d="M8 12h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  unknown: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.2" />
      <path d="M12 8v1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M12 11c1 0 1.5 0.5 1.5 1 0 1-1 1-1 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  ),
};

export default function FilterBar({
  types,
  counts,
  selected,
  onSelect,
}: {
  types: string[];
  counts: Record<string, number>;
  selected: string | null;
  onSelect: (t: string | null) => void;
}) {
  return (
    <div className="flex flex-wrap gap-3 items-center mb-6">
      <button
        onClick={() => onSelect(null)}
        className={`flex items-center gap-2 px-3 py-1 rounded-full transition-transform transform hover:-translate-y-0.5 focus:outline-none
          ${selected === null ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg" : "bg-white/6 text-white backdrop-blur-sm border border-white/6"}`}
        title="Mostrar todos"
      >
        <span className="text-sm font-semibold">Todos</span>
        <span className="text-xs inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-black/30 text-neutral-200">{Object.values(counts).reduce((a,b)=>a+b,0)}</span>
      </button>

      {types.map((t) => {
        const count = counts[t] ?? 0;
        const icon = ICONS[t] ?? ICONS.unknown;
        const active = selected === t;
        return (
          <button
            key={t}
            onClick={() => onSelect(active ? null : t)}
            className={`flex items-center gap-2 px-3 py-1 rounded-full transition-all transform hover:-translate-y-0.5 focus:outline-none ${
              active
                ? "bg-gradient-to-r from-green-600 to-lime-500 text-white shadow-lg scale-105"
                : "bg-white/6 text-white backdrop-blur-sm border border-white/6"
            }`}
            title={`${t} — ${count}`}
          >
            <span className="w-4 h-4 inline-flex items-center justify-center text-current">{icon}</span>
            <span className="text-sm font-medium capitalize">{t}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-black/30 text-neutral-200">{count}</span>
          </button>
        );
      })}
    </div>
  );
}
