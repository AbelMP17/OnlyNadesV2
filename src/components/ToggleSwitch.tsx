// src/components/ToggleSwitch.tsx
"use client";
import React from "react";

export default function ToggleSwitch({
  checked,
  onChange,
  label = "",
  ariaLabel = "Toggle",
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  ariaLabel?: string;
}) {
  return (
    <div className="flex items-center gap-3 justify-center w-full">
      <button
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 ${
          checked ? "bg-red-600" : "bg-neutral-700"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform duration-200 translate-y-[2px] ${
            checked ? "translate-x-7" : "translate-x-1"
          }`}
        />
      </button>

      <div className="flex flex-col">
        {label ? <div className="text-sm">{label}</div> : null}
        <div className="text-xs text-neutral-400">{checked ? "Sí" : "No"}</div>
      </div>
    </div>
  );
}
