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
                <Image src="/cargando.webp" width={20} height={20} className="animate-spin" alt="loading icon" />
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
            className={`p-4 rounded-lg ${
              theme === "light"
                ? "bg-white/90 text-black"
                : "bg-neutral-900 text-white"
            } shadow`}
          >
            <h3 className="font-semibold mb-2">Atajos</h3>
            <p className="text-sm mb-2">
              Selecciona un tipo arriba y luego haz click en un mapa para
              abrirlo ya filtrado.
            </p>
            <div className="mt-3">
              <h4 className="font-medium">Tipos populares</h4>
              <ul className="mt-2 text-sm space-y-1">
                {types.slice(0, 5).map((t) => (
                  <li key={t} className="flex justify-between">
                    <span className="capitalize">{t}</span>
                    <span>{counts[t] ?? 0}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
