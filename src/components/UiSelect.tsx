// src/components/UiSelect.tsx
"use client";

import React, { Fragment } from "react";
import { Listbox, Transition } from "@headlessui/react";

export type UiOption = { value: string; label: string };

export default function UiSelect({
  value,
  onChange,
  options,
  placeholder,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  options: UiOption[];
  placeholder?: string;
  className?: string;
}) {
  const selected = options.find((o) => o.value === value) ?? null;

  return (
    <div className={`relative w-full ${className}`}>
      <Listbox value={value} onChange={(v) => onChange(v)}>
        <div className="relative">
          <Listbox.Button className="relative w-full cursor-default rounded bg-white/5 py-2 pl-3 pr-10 text-left shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500">
            <span className="block truncate text-sm">{selected?.label ?? placeholder ?? "Seleccionar"}</span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              {/* chevron */}
              <svg className="w-4 h-4 text-neutral-300" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </Listbox.Button>

          <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
            <Listbox.Options className="absolute mt-1 max-h-56 w-full overflow-auto rounded bg-neutral-800 text-sm shadow-lg z-50 ring-1 ring-black/30">
              {options.map((opt) => (
                <Listbox.Option
                  key={opt.value}
                  value={opt.value}
                  className={({ active }) =>
                    `cursor-pointer select-none px-3 py-2 ${active ? "bg-neutral-700" : ""} flex items-center justify-between`
                  }
                >
                  {({ selected: sel }) => (
                    <>
                      <span className={`truncate ${sel ? "font-semibold" : ""}`}>{opt.label}</span>
                      {sel && (
                        <svg className="w-4 h-4 text-green-400" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                          <path d="M4.5 10.5l3 3 8-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  );
}
