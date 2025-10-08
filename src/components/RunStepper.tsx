// src/components/RunStepper.tsx
"use client";
import React from "react";

export default function RunStepper({
  value,
  onChange,
  min = 0,
  max = 999,
  ariaLabel = "Run steps",
}: {
  value?: number | null;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  ariaLabel?: string;
}) {
  const val = typeof value === "number" && !isNaN(value) ? value : 0;

  function dec() {
    onChange(Math.max(min, val - 1));
  }
  function inc() {
    onChange(Math.min(max, val + 1));
  }
  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const n = Number(e.target.value);
    if (Number.isNaN(n)) return;
    onChange(Math.max(min, Math.min(max, n)));
  }

  return (
    <div className="flex items-center gap-2 w-full justify-center">
      <label className="sr-only">{ariaLabel}</label>
      <button
        aria-label="Decrementar pasos"
        onClick={dec}
        className="inline-flex items-center justify-center w-9 h-9 rounded-md bg-neutral-800 hover:bg-neutral-700 border border-neutral-700"
        type="button"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M18 12H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      <input
        type="text"
        className="w-20 text-center p-2 rounded-md bg-white/5 border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-green-500"
        value={val}
        onChange={onInputChange}
        min={min}
        max={max}
        aria-label={ariaLabel}
      />

      <button
        aria-label="Incrementar pasos"
        onClick={inc}
        className="inline-flex items-center justify-center w-9 h-9 rounded-md bg-green-600 hover:bg-green-500 text-white"
        type="button"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );
}
