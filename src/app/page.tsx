// src/app/page.tsx
"use client";

import { useEffect, useState } from "react";
import { getMaps } from "@/lib/maps";
import { getNadesByMap } from "@/lib/nades";
import { MapDoc } from "@/lib/types";
import MapCard from "@/components/MapCard";

export default function HomePage() {
  const [maps, setMaps] = useState<MapDoc[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const mapsRes = await getMaps();
      if (!mounted) return;
      setMaps(mapsRes);

      // Fetch counts concurrently
      const promises = mapsRes.map(async (m) => {
        try {
          const nades = await getNadesByMap(m.slug);
          return { slug: m.slug, count: nades.length };
        } catch (err) {
          console.error("Error fetching nades for", m.slug, err);
          return { slug: m.slug, count: 0 };
        }
      });

      const results = await Promise.all(promises);
      if (!mounted) return;
      const mapCounts: Record<string, number> = {};
      results.forEach((r) => (mapCounts[r.slug] = r.count));
      setCounts(mapCounts);

      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <div className="p-8">Cargando mapas…</div>;

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {maps.map((m) => (
          <MapCard key={m.id} map={m} nadeCount={counts[m.slug] ?? 0} />
        ))}
      </div>
    </div>
  );
}
