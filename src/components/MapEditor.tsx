// src/components/MapEditor.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import type { NadeDoc, Pos } from "@/lib/types";
import { clientToPercent } from "@/lib/coords";

type SelectionMode = "select-to" | "select-from" | "browse";

type MapEditorProps = {
  mapImage: string;
  nades: NadeDoc[];
  interactive?: boolean;
  selectionMode?: SelectionMode;
  forceExpandKey?: string | null;
  singleToPos?: Pos | null;

  tempMarker?: Pos | null;
  tempMarkerMode?: "to" | "from" | undefined;
  allowTempMarker?: boolean;
  onTempPlace?: (which: "to" | "from", pos: Pos) => void;

  onSelectCluster?: (clusterKey: string, items: NadeDoc[], center: Pos) => void;
  onSelectFrom?: (nade: NadeDoc) => void;
};

type Cluster = { key: string; x: number; y: number; items: NadeDoc[] };

export default function MapEditor({
  mapImage,
  nades,
  interactive = true,
  selectionMode = "browse",
  forceExpandKey = null,
  singleToPos = null,
  tempMarker = null,
  tempMarkerMode,
  allowTempMarker = true,
  onTempPlace,
  onSelectCluster,
  onSelectFrom,
}: MapEditorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [expandedItems, setExpandedItems] = useState<NadeDoc[]>([]);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

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

    // prioridad: forceExpandKey (selección de cluster existente) > singleToPos (nuevo to)
    if (forceExpandKey) {
      const c = makeClusters(nades, 1).find((cc) => cc.key === forceExpandKey);
      if (c) {
        setExpandedKey(c.key);
        setExpandedItems(c.items);
      } else {
        setExpandedKey(null);
        setExpandedItems([]);
      }
      return;
    }

    // si singleToPos viene: mostrar SOLO el badge en singleToPos y expandir únicamente
    // los nades que realmente coincidan (comparación estricta).
    if (singleToPos) {
      const THRESHOLD = 0.9;
      const sx = Math.round(singleToPos.x * 100) / 100;
      const sy = Math.round(singleToPos.y * 100) / 100;

      const related = nades.filter((n) => {
        if (!n.toPos) return false;
        const tx = Math.round(n.toPos.x * 100) / 100;
        const ty = Math.round(n.toPos.y * 100) / 100;
        const dx = tx - sx;
        const dy = ty - sy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist <= THRESHOLD;
      });

      setExpandedKey(null);
      setExpandedItems(related);
      return;
    }

    setExpandedKey(null);
    setExpandedItems([]);
  }, [nades, forceExpandKey, singleToPos]);

  // overlay handler: recibe clicks en "zona libre"
  function handleOverlayPointerDown(e: React.PointerEvent) {
    if (!interactive || !containerRef.current) return;
    const native = e.nativeEvent as PointerEvent;
    const pos = clientToPercent((native as unknown) as MouseEvent, containerRef.current);

    // Si estamos en select-to y el usuario hace click fuera para crear un nuevo "to",
    // debemos limpiar cualquier cluster expandido para que no se mantenga la selección previa.
    // Lo hacemos LOCALMENTE en el editor (además del parent handler) para evitar UI stale.
    if (selectionMode === "select-to") {
      setExpandedKey(null);
      setExpandedItems([]);
    }

    // Notificamos al padre (quien maneja to/from temp)
    onTempPlace?.(selectionMode === "select-to" ? "to" : "from", pos);
  }

  function handleClusterClick(cluster: Cluster, e: React.MouseEvent) {
    e.stopPropagation();
    if (selectionMode === "select-to") {
      onSelectCluster?.(cluster.key, cluster.items, { x: cluster.x, y: cluster.y });
      return;
    }
    if (expandedKey === cluster.key) {
      setExpandedKey(null);
      setExpandedItems([]);
      return;
    }
    setExpandedKey(cluster.key);
    setExpandedItems(cluster.items);
  }

  function handleOriginClick(n: NadeDoc, e: React.MouseEvent) {
    e.stopPropagation();
    if (selectionMode === "select-from") {
      onSelectFrom?.(n);
      return;
    }
  }

  const clustersToRender = singleToPos
    ? []
    : (selectionMode === "select-from" && forceExpandKey ? clusters.filter(c => c.key === forceExpandKey) : clusters);

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-lg overflow-hidden bg-black"
      style={{
        backgroundImage: `url(${mapImage})`,
        backgroundSize: "contain",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        aspectRatio: "4/3",
      }}
    >
      {/* overlay captura clicks en zona libre */}
      <div
        className="absolute inset-0 z-10"
        onPointerDown={(e) => handleOverlayPointerDown(e)}
        style={{ background: "transparent", touchAction: "none" }}
      />

      {/* líneas */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
        {(expandedItems.length > 0) &&
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

      {/* Si singleToPos viene, mostramos un badge 'to' únicamente en esa posición */}
      {singleToPos && (
        <div
          className="absolute z-30 cursor-pointer select-none"
          style={{ left: `${singleToPos.x}%`, top: `${singleToPos.y}%`, transform: "translate(-50%,-50%)" }}
          data-role="map-marker"
        >
          <div className="w-7 h-7 rounded-full bg-yellow-400 border-2 border-white shadow-md flex items-center justify-center text-sm font-semibold" />
        </div>
      )}

      {/* clusters (si singleToPos no existe) */}
      {clustersToRender.map((c) => (
        <div
          key={c.key}
          data-role="map-marker"
          onClick={(e) => handleClusterClick(c, e)}
          style={{ left: `${c.x}%`, top: `${c.y}%`, transform: "translate(-50%,-50%)" }}
          className="absolute z-30 cursor-pointer select-none"
        >
          <div className="w-7 h-7 rounded-full bg-yellow-400 border-2 border-white shadow-md flex items-center justify-center text-sm font-semibold">
            {c.items.length > 1 ? c.items.length : ""}
          </div>
        </div>
      ))}

      {/* origenes (fromPos) */}
      {(expandedItems.length > 0 ? expandedItems : []).map((n) => {
        if (!n.fromPos) return null;
        return (
          <div
            key={n.id}
            data-role="map-marker"
            onClick={(e) => handleOriginClick(n, e)}
            style={{ left: `${n.fromPos!.x}%`, top: `${n.fromPos!.y}%`, transform: "translate(-50%,-50%)" }}
            className="absolute z-40 cursor-pointer select-none"
          >
            <div className="w-4 h-4 rounded-full bg-white/90 border-2 border-black shadow flex items-center justify-center text-xs font-semibold text-black"></div>
          </div>
        );
      })}

      {/* temp marker (provisto por el padre) */}
      {tempMarker && allowTempMarker && (
        <div style={{ left: `${tempMarker.x}%`, top: `${tempMarker.y}%`, transform: "translate(-50%,-50%)" }} className="absolute z-50 pointer-events-none">
          <div className={`w-7 h-7 rounded-full ${tempMarkerMode === "to" ? "bg-yellow-400" : "bg-blue-500"} border-2 border-white shadow-md flex items-center justify-center text-sm font-semibold text-white pb-1`}>+</div>
        </div>
      )}
    </div>
  );
}
