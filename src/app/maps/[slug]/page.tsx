// src/app/map/[slug]/page.tsx (o la ruta que uses para MapDetailPage)
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { getNadesByMap } from "@/lib/nades";
import type { NadeDoc, MapDoc } from "@/lib/types";
import MarkerPreview from "@/components/MarkerPreview";
import NadeModal from "@/components/NadeModal";
import NadeWizard from "@/components/NadeWizard";
import { getMaps } from "@/lib/maps";
import { useAuth } from "@/lib/auth";
import { ADMIN_UID } from "@/lib/constants";
import MapViewer from "@/components/MapViewer";
import { useTheme } from "@/context/ThemeContext";

const TYPE_ORDER = ["smoke", "flash", "molotov", "he", "decoy"];

export default function MapDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [nades, setNades] = useState<NadeDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [hovered, setHovered] = useState<NadeDoc | null>(null);
  const [hoverCoords, setHoverCoords] = useState<
    { x: number; y: number } | undefined
  >(undefined);
  const [openNade, setOpenNade] = useState<NadeDoc | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [map, setMap] = useState<MapDoc | null>(null);
  const { theme } = useTheme();

  const { user } = useAuth();
  const isAdmin = user?.uid === ADMIN_UID;

  // filtros
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedSide, setSelectedSide] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    getNadesByMap(slug).then((res) => {
      setNades(res);
      setLoading(false);
    });
    getMaps().then((maps) => {
      const found = maps.find((m) => m.slug === slug);
      if (found) setMap(found);
    });
  }, [slug]);

  // calcular conteos por tipo y por side (memoizados)
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of TYPE_ORDER) counts[t] = 0;
    for (const n of nades) {
      const k = (n.type ?? "unknown").toLowerCase();
      counts[k] = (counts[k] ?? 0) + 1;
    }
    return counts;
  }, [nades]);

  const sideCounts = useMemo(() => {
    const counts: Record<string, number> = { T: 0, CT: 0 };
    for (const n of nades) {
      const s = (n.side ?? "").toUpperCase();
      if (s === "T" || s === "CT") counts[s] = (counts[s] ?? 0) + 1;
    }
    return counts;
  }, [nades]);

  // nades a pasar al MapViewer (filtradas por type & side)
  const filteredNades = useMemo(() => {
    return nades.filter((n) => {
      if (selectedType && (n.type ?? "").toLowerCase() !== selectedType)
        return false;
      if (selectedSide && (n.side ?? "").toUpperCase() !== selectedSide)
        return false;
      return true;
    });
  }, [nades, selectedType, selectedSide]);

  // helpers UI
  function toggleTypeFilter(t: string) {
    setSelectedType((cur) => (cur === t ? null : t));
  }
  function clearTypeFilter() {
    setSelectedType(null);
  }
  function toggleSideFilter(s: "T" | "CT") {
    setSelectedSide((cur) => (cur === s ? null : s));
  }
  function clearSideFilter() {
    setSelectedSide(null);
  }

  if (!slug) return <p>Mapa no especificado</p>;
  if (loading) return <p>Cargando nades…</p>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
      {/* Sidebar */}
      <aside>
        <div
          className={`${
            theme === "light" ? "bg-white/50" : "bg-white/5"
          } p-4 rounded mb-4 backdrop-blur-md`}
        >
          <h2 className="text-lg font-bold">{map?.name ?? slug}</h2>
          <p
            className={`text-sm ${
              theme === "light" ? "text-neutral-800" : "text-neutral-200"
            }`}
          >
            Find the best {map?.name ?? slug} smokes, molotovs, flashbangs, and HE grenades for Counter-Strike 2. Learn the best nade lineups on OnlyNades.
          </p>

          <div className="mt-4">
            {isAdmin ? (
              <button
                onClick={() => setWizardOpen(true)}
                className="px-3 py-2 m-auto rounded bg-blue-600 hover:bg-blue-700 hover:rounded-[25px] text-white relative font-bold text-lg flex justify-center items-center gap-1 group"
              >
                <p className="absolute opacity-0 group-hover:opacity-100 left-3">
                  +
                </p>
                <p className="group-hover:ml-6 group-hover:tracking-tighter">
                  Submit Nade
                </p>
              </button>
            ) : null}
          </div>
        </div>

        {/* Sección: contadores por tipo (clickable) */}
        <div
          className={`${
            theme === "light"
              ? "bg-white/50 text-black"
              : "bg-white/5 text-white"
          } p-4 rounded mb-4 backdrop-blur-md`}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Nades ({nades.length})</h3>
            <div className="text-xs font-semibold">Filtrar por tipo</div>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <div className="grid grid-cols-2 gap-2">
              {TYPE_ORDER.map((t) => {
                const count = typeCounts[t] ?? 0;
                const active = selectedType === t;
                return (
                  <button
                    key={t}
                    onClick={() => toggleTypeFilter(t)}
                    className={`w-full px-3 py-2 rounded-lg hover:rounded-[25px] text-xs font-medium transition transform ${
                      active && selectedType === "smoke" ? "bg-gray-600 scale-105 text-white"
                        : active && selectedType === "flash" ? "bg-yellow-200 scale-105 text-black": active && selectedType === "molotov" ? "bg-red-400 scale-105":  active && selectedType === "he" ? "bg-green-400 scale-105" : active && selectedType === "he" ? "bg-green-400 scale-105 text-black" : active && selectedType === "decoy" ? "bg-green-700 scale-105 text-white" :"bg-white/40 hover:bg-white/70"
                    }`}
                    aria-pressed={active}
                    title={`Mostrar ${t} (${count})`}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)} · {count}
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between items-center gap-2 mt-2">
              <button
                onClick={clearTypeFilter}
                className="px-2 py-1 text-[14px] rounded bg-transparent border border-white/40 hover:bg-red-400/40"
              >
                Limpiar filtro tipo
              </button>
              <div className="text-xs">
                <b>Mostrando:</b> {selectedType ?? "Todas"}
              </div>
            </div>
          </div>
        </div>

        {/* Nueva sección: contadores por side (T / CT) */}
        <div
          className={`${
            theme === "light"
              ? "bg-white/50 text-black"
              : "bg-white/5 text-white"
          } p-4 rounded mb-4 backdrop-blur-md`}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Filtrar por equipo</h3>
            <div className="text-xs text-neutral-400">T / CT</div>
          </div>

          <div className="flex gap-2 items-center">
            <button
              onClick={() => toggleSideFilter("T")}
              className={`w-full px-3 py-2 rounded-lg hover:rounded-[25px] text-xs font-medium transition transform ${
                selectedSide === "T"
                  ? "bg-orange-400 text-black scale-105"
                  : "bg-white/40 hover:bg-white/70"
              }`}
              aria-pressed={selectedSide === "T"}
            >
              T · {sideCounts["T"] ?? 0}
            </button>

            <button
              onClick={() => toggleSideFilter("CT")}
              className={`w-full px-3 py-2 rounded-lg hover:rounded-[25px] text-xs font-medium transition transform ${
                selectedSide === "CT"
                  ? "bg-blue-500 text-black scale-105"
                  : "bg-white/40 hover:bg-white/70"
              }`}
              aria-pressed={selectedSide === "CT"}
            >
              CT · {sideCounts["CT"] ?? 0}
            </button>

            
          </div>
          <div className="flex justify-between items-center gap-2 mt-2">
            <button
              onClick={clearSideFilter}
              className="px-2 py-1 text-[15px] rounded bg-transparent border border-white/40 hover:bg-red-400/40"
            >
              Limpiar filtro equipo
            </button>
            <div className="mt-2 text-xs">
            <b>Mostrando:</b> {selectedSide ?? "Ambos"}
          </div>
          </div>
          
        </div>
      </aside>

      {/* Map area */}
      <section>
        <MapViewer
          mapImage={map?.mapImage ?? ""}
          nades={filteredNades}
          hoverPreview={(n, coords) => {
            setHovered(n);
            setHoverCoords(coords);
          }}
          onOpenNade={(n) => setOpenNade(n)}
        />

        {/* preview when hover/tap */}
        <MarkerPreview
          nade={hovered}
          coords={hoverCoords}
          onOpen={(n) => setOpenNade(n)}
        />

        {/* modal open */}
        {openNade && (
          <NadeModal nade={openNade} onClose={() => setOpenNade(null)} />
        )}

        {/* wizard for admin */}
        {wizardOpen && map && (
          <NadeWizard
            open={wizardOpen}
            onClose={() => setWizardOpen(false)}
            mapSlug={slug}
            mapImage={map.mapImage ?? ""}
            existingNades={nades}
          />
        )}
      </section>
    </div>
  );
}
