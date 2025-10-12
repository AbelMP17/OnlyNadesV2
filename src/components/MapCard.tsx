// src/components/MapCard.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapDoc } from "@/lib/types";
import { useTheme } from "@/context/ThemeContext";
import Image from "next/image";

export default function MapCard({
  map,
  nadeCount = 0,
  asLink = true,
}: {
  map: MapDoc;
  nadeCount?: number;
  asLink?: boolean;
}) {
  const { theme } = useTheme();
  const router = useRouter();
  const textShadow =
    theme === "light"
      ? "0 8px 28px rgba(0,0,0,0.6)"
      : "0 10px 28px rgba(0,0,0,0.9)";

  const content = (
    <div
      className="relative group rounded-lg overflow-hidden transform transition-all duration-300 hover:-translate-y-2  hover:shadow-xl hover:shadow-amber-500/40 hover:rounded-[100px]"
      role={asLink ? undefined : "button"}
      tabIndex={asLink ? undefined : 0}
      onKeyDown={(e) => {
        if (!asLink && (e.key === "Enter" || e.key === " ")) {
          router.push(`/maps/${map.slug}`);
        }
      }}
      onClick={() => {
        if (!asLink) router.push(`/maps/${map.slug}`);
      }}
      aria-label={`Ver mapa ${map.name}`}
    >
      <div className="relative w-full h-48 md:h-40 lg:h-44 bg-black">
        <img
          src={map.imageUrl}
          alt={map.name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />

        {map.logoImage && (
          <Image
            src={map.logoImage}
            alt={`${map.name} logo`}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2/3 opacity-95 pointer-events-none"
          />
        )}

        <div className="absolute left-0 bottom-3 group-hover:left-7 px-3 flex items-center justify-between">
          <div>
            <div
              className="text-lg font-semibold text-white bg-gray-900/40 px-2 rounded-lg group-hover:rounded-[100px]"
              style={{ textShadow }}
            >
              {map.name}
            </div>
          </div>
        </div>

        <div className="absolute top-3 right-3 group-hover:top-6 group-hover:right-6">
          <div className="w-8 h-8 border-b border-gray-800 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 text-black flex items-center justify-center font-bold shadow-md">
            {nadeCount}
          </div>
        </div>
      </div>
    </div>
  );

  if (asLink) {
    return (
      <Link href={`/maps/${map.slug}`} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
