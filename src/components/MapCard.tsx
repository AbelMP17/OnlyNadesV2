// src/components/MapCard.tsx
"use client";

import Link from "next/link";
import { MapDoc } from "@/lib/types";
import { useTheme } from "@/context/ThemeContext";

export default function MapCard({
  map,
  nadeCount = 0,
}: {
  map: MapDoc;
  nadeCount?: number;
}) {
  const textShadow = "0 6px 18px rgba(0,0,0,0.7)";
  const { theme } = useTheme();

  return (
    <Link
      href={`/maps/${map.slug}`}
      className={`relative flex justify-center items-center rounded-lg overflow-hidden border cs-card group transform transition-all duration-200 ${theme === 'light' ? 'shadow-black/40' : 'shadow-white/50'} hover:-translate-y-3 hover:shadow-lg`}
      aria-label={`Ver mapa ${map.name}`}
    >
      <img
        src={map.imageUrl}
        alt={map.name}
        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105 z-0"
      />

      {map.logoImage && (
        <img
          src={map.logoImage}
          alt={`${map.name} logo`}
          className="absolute z-20 mapcard-logo w-[55%]"
          style={{ pointerEvents: "none" }}
        />
      )}

      {/* Nombre y contador */}
      <div className="absolute bottom-4 left-0 right-0 p-3 z-50 flex flex-col items-center text-white">
        <div
          className="inline lg:hidden font-semibold text-lg lg:text-2xl leading-tight cs-text-shadow"
          style={{ textShadow }}
        >
          {map.name}
        </div>

        {/* subtítulo con contador */}
        <div className="mt-2 text-sm text-white flex items-center gap-2 bg-black/50 backdrop-blur-md p-2 rounded-full overflow-hidden lg:pr-4 capitalize">
          <span className="px-2 py-0.5 rounded-full bg-white/6 text-xs font-medium ">
            {nadeCount} {nadeCount === 1 ? "granada" : "granadas"}
          </span>
          <span className="hidden lg:inline">· <i className="ml-2">{map.slug}</i></span>
        </div>
      </div>
    </Link>
  );
}
