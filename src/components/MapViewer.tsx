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
      setExpandedKey(null);
      setExpandedItems([]);
      return;
    }
    setExpandedKey(cluster.key);
    setExpandedItems(cluster.items);
    // NO mostramos preview al clicar el cluster: preview solo para froms
    // Si quieres volver a mostrar preview aquí, añade hoverPreview?.(...)
  }

  function handleOriginClick(n: NadeDoc, e: React.MouseEvent) {
    e.stopPropagation();
    onOpenNade?.(n);
  }

  return (
    <div
      ref={containerRef}
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

      {/* clusters (badges grandes) — SIN preview en hover */}
      {clusters.map((c) => (
        <div
          key={c.key}
          onClick={(e) => handleClusterClick(c, e)}
          // no hoverPreview aquí: solo expandimos al click
          style={{ left: `${c.x}%`, top: `${c.y}%`, transform: "translate(-50%,-50%)" }}
          className="absolute z-30 cursor-pointer select-none"
          data-role="map-marker"
        >
          <div className={`md:w-7 md:h-7 w-4 h-4 rounded-full bg-yellow-400 border-2 border-black shadow-md flex items-center justify-center text-sm font-semibold text-black`}>
            {c.items.length > 1 ? c.items.length : ""}
          </div>
        </div>
      ))}

      {/* origin markers (fromPos) — AQUI sí mostramos preview en hover */}
      {(expandedItems.length > 0 ? expandedItems : []).map((n) => {
        if (!n.fromPos) return null;
        return (
          <div
            key={n.id}
            onClick={(e) => handleOriginClick(n, e)}
            onPointerEnter={() => {
              // show preview centered at the origin marker initially
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
            <div className={`w-4 h-4 rounded-full ${n.side === "ct" ? "bg-blue-800" : "bg-orange-400" } bg-blue-800/90 border-2 border-black shadow flex items-center justify-center text-xs font-semibold text-black`}></div>
          </div>
        );
      })}
    </div>
  );
}
