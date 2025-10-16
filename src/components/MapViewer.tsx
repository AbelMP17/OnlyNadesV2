// src/components/MapViewer.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import type { NadeDoc, Pos } from "@/lib/types";

type MapViewerProps = {
  mapImage: string;
  nades: NadeDoc[];
  hoverPreview?: (nade: NadeDoc | null, coords?: { x: number; y: number }) => void;
  onOpenNade?: (nade: NadeDoc) => void;
};

type Cluster = { key: string; x: number; y: number; items: NadeDoc[] };

export default function MapViewer({ mapImage, nades, hoverPreview, onOpenNade }: MapViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<NadeDoc[]>([]);

  function makeClusters(items: NadeDoc[], bucket = 1) {
    const map = new Map<string, Cluster>();
    for (const n of items) {
      const pos = n.toPos ?? n.fromPos;
      if (!pos) continue;
      const kx = Math.round(pos.x / bucket);
      const ky = Math.round(pos.y / bucket);
      const key = `${kx}_${ky}`;
      const cx = kx * bucket;
      const cy = ky * bucket;
      const existing = map.get(key);
      if (!existing) map.set(key, { key, x: cx, y: cy, items: [n] });
      else existing.items.push(n);
    }
    return Array.from(map.values());
  }

  useEffect(() => {
    setClusters(makeClusters(nades, 1));
    setExpandedKey(null);
    setExpandedItems([]);
  }, [nades]);

  function percentToClient(percent: Pos) {
    const node = containerRef.current;
    if (!node) return { x: 0, y: 0 };
    const rect = node.getBoundingClientRect();
    return { x: rect.left + (percent.x / 100) * rect.width, y: rect.top + (percent.y / 100) * rect.height };
  }

  function handleClusterClick(cluster: Cluster, e: React.MouseEvent) {
    e.stopPropagation();
    if (expandedKey === cluster.key) {
      // cerrar expansión
      setExpandedKey(null);
      setExpandedItems([]);
      return;
    }
    // expandir solo este cluster
    setExpandedKey(cluster.key);
    setExpandedItems(cluster.items);
  }

  function handleOriginClick(n: NadeDoc, e: React.MouseEvent) {
    e.stopPropagation();
    onOpenNade?.(n);
  }

  // Si hay un cluster expandido, solo renderizamos ese cluster; si no, todos.
  const clustersToRender = expandedKey ? clusters.filter((c) => c.key === expandedKey) : clusters;

  /* -----------------------
     Deseleccionar al hacer click fuera / en fondo
     - Si click fuera de container => deseleccionar
     - Si click dentro del container pero no sobre un element con data-role="map-marker" => deseleccionar
     ----------------------- */
  useEffect(() => {
    function onDocPointerDown(ev: PointerEvent) {
      if (!expandedKey) return;
      const node = containerRef.current;
      if (!node) return;
      const target = ev.target as Node | null;
      if (!target) return;
      // Si el click está fuera del contenedor, deselecciona
      if (!node.contains(target)) {
        setExpandedKey(null);
        setExpandedItems([]);
      }
      // si está dentro y encima de un marker, no hacemos nada (cluster/origin handlers lo gestionan)
    }

    window.addEventListener("pointerdown", onDocPointerDown);
    return () => window.removeEventListener("pointerdown", onDocPointerDown);
  }, [expandedKey]);

  // Handler en el propio contenedor: si haces click en el fondo (no sobre un marker),
  // cerramos la expansión. Usamos pointerDown para cubrir touch/click.
  function onContainerPointerDown(e: React.PointerEvent) {
    if (!expandedKey) return;
    const el = e.target as HTMLElement | null;
    if (!el) return;
    // si el elemento clicado o alguno de sus padres tiene data-role="map-marker", NO deseleccionar
    const isOnMarker = el.closest && (el.closest('[data-role="map-marker"]') as HTMLElement | null);
    if (!isOnMarker) {
      setExpandedKey(null);
      setExpandedItems([]);
    }
    // si es marker, dejamos que los handlers específicos manejen la interacción
  }

  return (
    <div
      ref={containerRef}
      onPointerDown={onContainerPointerDown}
      className="relative w-full rounded-lg overflow-hidden bg-black/70"
      style={{
        backgroundImage: `url(${mapImage})`,
        backgroundSize: "contain",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        aspectRatio: "4/3",
      }}
    >
      {/* SVG lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
        {expandedItems.length > 0 &&
          (() => {
            const node = containerRef.current;
            if (!node) return null;
            const rect = node.getBoundingClientRect();
            return expandedItems
              .map((n) => {
                const to = n.toPos ?? n.fromPos;
                const from = n.fromPos ?? n.toPos;
                if (!to || !from) return null;
                const x1 = (to.x / 100) * rect.width;
                const y1 = (to.y / 100) * rect.height;
                const x2 = (from.x / 100) * rect.width;
                const y2 = (from.y / 100) * rect.height;
                return <line key={n.id} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#f1c40f" strokeDasharray="6 4" strokeWidth={2} />;
              })
              .filter(Boolean);
          })()}
      </svg>

      {/* clusters (badges grandes) — si hay uno seleccionado, los demás estarán ocultos por clustersToRender */}
      {clustersToRender.map((c) => (
        <div
          key={c.key}
          onClick={(e) => handleClusterClick(c, e)}
          style={{ left: `${c.x}%`, top: `${c.y}%`, transform: "translate(-50%,-50%)" }}
          className="absolute z-30 cursor-pointer select-none"
          data-role="map-marker"
        >
          <div className={`md:w-7 md:h-7 w-4 h-4 hover:scale-125 rounded-full bg-yellow-400 border-2 border-black shadow-md flex items-center justify-center text-sm font-semibold text-black`}>
            {c.items.length > 1 ? c.items.length : ""}
          </div>
        </div>
      ))}

      {/* origin markers (fromPos) — solo los expandedItems se muestran (si hay expansión), y sobre ellos mostramos preview en hover */}
      {(expandedItems.length > 0 ? expandedItems : []).map((n) => {
        if (!n.fromPos) return null;
        return (
          <div
            key={n.id}
            onClick={(e) => handleOriginClick(n, e)}
            onPointerEnter={() => {
              const client = percentToClient(n.fromPos!);
              hoverPreview?.(n, client);
            }}
            onPointerMove={(e) => {
              const ev = e as React.PointerEvent;
              hoverPreview?.(n, { x: ev.clientX, y: ev.clientY });
            }}
            onPointerLeave={() => hoverPreview?.(null)}
            style={{ left: `${n.fromPos!.x}%`, top: `${n.fromPos!.y}%`, transform: "translate(-50%,-50%)" }}
            className="absolute z-40 cursor-pointer select-none"
            data-role="map-marker"
          >
            <div className={`w-4 h-4 rounded-full ${n.side?.toLowerCase() === "ct" ? "bg-blue-800" : "bg-orange-400"} border-2 hover:scale-125 border-black shadow flex items-center justify-center text-xs font-semibold text-black`}></div>
          </div>
        );
      })}
    </div>
  );
}
