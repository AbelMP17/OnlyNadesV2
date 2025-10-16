// src/app/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getMaps } from "@/lib/maps";
import { getTypeCounts } from "@/lib/nades";
import { MapDoc } from "@/lib/types";
import MapCard from "@/components/MapCard";
import FilterBar from "@/components/FilterBar";
import { useTheme } from "@/context/ThemeContext";
import Image from "next/image";

export default function HomePage() {
  const [maps, setMaps] = useState<MapDoc[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [countsByMap, setCountsByMap] = useState<
    Record<string, Record<string, number>>
  >({});
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const mapsRes = await getMaps();
      if (!mounted) return;
      setMaps(mapsRes);

      try {
        const globalCounts = await getTypeCounts();
        if (!mounted) return;
        setCounts(globalCounts);
      } catch (err) {
        console.error(err);
      }

      // counts by map (optimizado: usa getTypeCounts(mapSlug) por cada mapa)
      try {
        const ps = mapsRes.map(async (m) => {
          const byMap = await getTypeCounts(m.slug);
          return { slug: m.slug, counts: byMap };
        });
        const arr = await Promise.all(ps);
        if (!mounted) return;
        const mapCounts: Record<string, Record<string, number>> = {};
        arr.forEach((r) => (mapCounts[r.slug] = r.counts));
        setCountsByMap(mapCounts);
      } catch (err) {
        console.error(err);
      }

      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const types = Object.keys(counts).sort(
    (a, b) => (counts[b] ?? 0) - (counts[a] ?? 0)
  );

  return (
    <div className="space-y-6">
      {/* HERO */}
      <div
        className={`rounded-lg p-6 ${
          theme === "light"
            ? "bg-white/80 text-black"
            : "bg-gradient-to-r from-neutral-800 to-neutral-900 text-white"
        } shadow-lg`}
      >
        <h1 className="text-3xl font-extrabold">OnlyNades</h1>
        <p className="mt-2 text-sm opacity-80">
          Guías visuales y vídeos de lineups para Counter-Strike 2. Selecciona
          un tipo y luego entra en un mapa para filtrar automáticamente.
        </p>
      </div>

      <FilterBar
        types={types}
        counts={counts}
        selected={selectedType}
        onSelect={(t) => setSelectedType(t)}
      />

      <div className=" grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="relative grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {loading && (
              <div className="absolute top-0 left-0 w-full h-full flex justify-center items-center">
                <Image
                  src="/cargando.webp"
                  width={20}
                  height={20}
                  className="animate-spin"
                  alt="loading icon"
                />
              </div>
            )}
            {maps.map((m) => {
              const countForThisType = selectedType
                ? countsByMap[m.slug]?.[selectedType] ?? 0
                : Object.values(countsByMap[m.slug] ?? {}).reduce(
                    (a, b) => a + b,
                    0
                  ) || 0;
              const href = selectedType
                ? `/maps/${m.slug}?type=${encodeURIComponent(selectedType)}`
                : `/maps/${m.slug}`;
              return (
                <Link key={m.id} href={href} className="block">
                  <MapCard
                    map={m}
                    nadeCount={countForThisType}
                    asLink={false}
                  />
                </Link>
              );
            })}
          </div>
        </div>

        <aside>
          <div
            className={`rounded-lg ${
              theme === "light"
                ? "bg-white/90 text-black"
                : "bg-neutral-900 text-white"
            } shadow`}
          >
            <h3 className="font-semibold p-3 pb-0">Atajos</h3>
            <p className="text-sm mb-2 p-3">
             Selecciona un tipo arriba y luego haz click en un mapa para
              abrirlo ya filtrado.
            </p>

            <div
              className={`flex flex-col justify-center items-center md:col-span-1 font-extralight shadow-lg ${
                theme === "light"
                  ? "bg-gray-800/60 shadow-black text-white"
                  : "bg-gray-800/60 shadow-gray-700"
              } backdrop-blur-xs w-full h-fit z-20 rounded-xl p-5 gap-2 border-y border-white`}
            >
              <h4 className="font-medium p-3 uppercase italic text-xl">Support Us</h4>
              <div className="w-full flex justify-center items-center gap-2">
                <a
                  href="https://www.youtube.com/@falconzz8859"
                  target="_blank"
                  className="bg-white nm-button w-[40px] hover:w-[140px] h-[40px] rounded-full  font-bold relative overflow-hidden text-transparent hover:text-black group flex justify-end items-center uppercase"
                >
                  <Image
                    src="/youtube.webp"
                    alt="patreon"
                    width={32}
                    height={32}
                    className="absolute left-1 top-1"
                  />
                  Youtube
                </a>
                <a
                  href="https://patreon.com/OnlyNades?utm_medium=unknown&utm_source=join_link&utm_campaign=creatorshare_creator&utm_content=copyLink"
                  target="_blank"
                  className="bg-white nm-button w-[40px] hover:w-[120px] h-[40px] rounded-full  font-bold relative overflow-hidden text-transparent hover:text-black group flex justify-end items-center uppercase"
                >
                  <Image
                    src="/patreon.webp"
                    alt="patreon"
                    width={32}
                    height={32}
                    className="absolute left-1 top-1"
                  />
                  atreon
                </a>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
