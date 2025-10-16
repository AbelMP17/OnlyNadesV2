// src/components/NadeModal.tsx
"use client";

import React, { useState } from "react";
import type { NadeDoc, Pos } from "@/lib/types";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/lib/auth";
import { useFavorites } from "@/hooks/useFavorites";

export default function NadeModal({
  nade,
  onClose,
}: {
  nade: NadeDoc;
  onClose: () => void;
}) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const { isFavorite, toggleFavorite } = useFavorites(uid);
  const [copyLinkText, setCopyLinkText] = useState("Copiar URL Vídeo");
  const [copyResume, setCopyResume] = useState("Copiar Resumen");

  /* --------------------
     Helpers tipados
     -------------------- */
  function getYouTubeId(url?: string | null): string | null {
    if (!url) return null;
    const m = url.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/);
    return m ? m[1] : null;
  }

  function youtubeEmbedUrl(videoId: string) {
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&rel=0&modestbranding=1&playsinline=1&loop=1&playlist=${videoId}`;
  }

  function isYouTube(url?: string | null) {
    if (!url) return false;
    return /youtube\.com|youtu\.be/.test(url);
  }

  function isDirectVideo(url?: string | null) {
    if (!url) return false;
    return /\.(mp4|webm|mov|ogg)(\?.*)?$/i.test(url);
  }

  async function copy(text?: string | null) {
    if (!text) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // fallback
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
      }
    } catch {
      // ignore copy errors silently
    }
  }

  function formatDate(d: unknown) {
    if (d == null) return "—";
    try {
      // Tipado seguro para posibles formas de timestamp de Firestore / number / string
      type MaybeTimestamp = {
        toDate?: () => Date;
        toMillis?: () => number;
        seconds?: number;
        nanoseconds?: number;
      };

      const maybeTimestamp = d as MaybeTimestamp;

      // Firestore Timestamp has toDate()
      if (maybeTimestamp && typeof maybeTimestamp.toDate === "function") {
        return maybeTimestamp.toDate().toLocaleString();
      }
      // Firestore-like object with toMillis()
      if (maybeTimestamp && typeof maybeTimestamp.toMillis === "function") {
        return new Date(maybeTimestamp.toMillis()).toLocaleString();
      }
      // Raw object with seconds/nanos
      if (maybeTimestamp && typeof maybeTimestamp.seconds === "number") {
        const millis =
          maybeTimestamp.seconds * 1000 +
          Number(maybeTimestamp.nanoseconds || 0) / 1e6;
        return new Date(millis).toLocaleString();
      }

      // number (ms since epoch)
      if (typeof d === "number") return new Date(d).toLocaleString();

      // numeric string with epoch millis
      if (typeof d === "string" && /^\d+$/.test(d)) {
        return new Date(Number(d)).toLocaleString();
      }

      // try generic parse
      const parsed = new Date(String(d));
      if (!isNaN(parsed.getTime())) return parsed.toLocaleString();

      return String(d);
    } catch {
      return String(d);
    }
  }

  function humanize(val?: string | null) {
    if (val === undefined || val === null || val === "") return "—";
    const s = String(val);
    return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  function constructShareText(n: NadeDoc) {
    const lines: string[] = [];
    lines.push(n.title ?? "Untitled nade");
    lines.push(`${n.mapSlug} · ${n.type ?? "—"} · ${n.side ?? "—"}`);
    if (n.position) lines.push(`Position: ${n.position}`);
    if (n.target) lines.push(`Target: ${n.target}`);
    if (n.toPos) lines.push(`To: ${formatPosStatic(n.toPos)}`);
    if (n.fromPos) lines.push(`From: ${formatPosStatic(n.fromPos)}`);
    if (n.videoUrl) lines.push(`Video: ${n.videoUrl}`);
    if (n.description) {
      lines.push("");
      lines.push(n.description);
    }
    return lines.join("\n");
  }

  function formatPosStatic(p?: Pos | null) {
    if (!p) return "—";
    return `${p.x.toFixed(1)}%, ${p.y.toFixed(1)}%`;
  }

  /* --------------------
     Media source calc
     -------------------- */
  const youtubeId = getYouTubeId(nade.videoUrl ?? undefined);
  const iframeSrc = youtubeId ? youtubeEmbedUrl(youtubeId) : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className={`${
          theme === "light" ? "bg-white" : "bg-neutral-900"
        } rounded-lg  w-full p-4 grid md:grid-cols-3 gap-4`}
      >
        {/* Media */}
        <div className="col-span-2">
          {isDirectVideo(nade.videoUrl ?? undefined) ? (
            <div className="mt-2 aspect-video">
              <video
                src={nade.videoUrl ?? undefined}
                autoPlay
                muted
                playsInline
                loop
                controls={false}
                className="w-full h-full object-cover rounded"
              />
            </div>
          ) : isYouTube(nade.videoUrl ?? undefined) && youtubeId ? (
            <>
              <div className="mt-2 aspect-video rounded-xl overflow-hidden bg-black">
                <iframe
                  src={iframeSrc}
                  title={nade.title ?? "Nade preview"}
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0 pointer-events-none"
                />
              </div>
              <div className="mt-3 flex gap-2">
                {nade.videoUrl && (
                  <button
                    onClick={() => {
                      copy(nade.videoUrl);
                      setCopyLinkText("Copiado!");
                      setTimeout(() => {
                        setCopyLinkText("Copiar URL Vídeo");
                      }, 1000);
                    }}
                    className={`px-3 py-1 rounded border text-sm nm-button ${
                      copyLinkText.includes("iado") ? "bg-blue-300/20" : ""
                    }`}
                    title="Copiar URL del vídeo"
                  >
                    {copyLinkText}
                  </button>
                )}
              </div>
            </>
          ) : null}

          {/* quick action buttons under media */}
        </div>

        {/* Info */}
        <div className="flex flex-col justify-between p-10 bg-black/30 rounded-xl">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h2 className="text-2xl font-bold">{nade.title ?? "Untitled"}</h2>
              <p className="text-sm text-neutral-600 mt-1">
                {nade.mapSlug} · {nade.type ?? "—"} · {nade.side ?? "—"} ·{" "}
                {nade.target ?? "—"}
              </p>
            </div>

            <div className="text-xs text-neutral-400 text-right">
              <div>Creado: {formatDate(nade.createdAt)}</div>
              <div className="mt-1">
                Por: {nade.createdByName ?? nade.createdByUid ?? "—"}
              </div>
            </div>
          </div>

          {/* description */}
          {nade.description && (
            <p className="mt-4 text-sm leading-relaxed">{nade.description}</p>
          )}

          {/* metadata badges */}
          <div className="mt-4 flex flex-wrap gap-2">
            {nade.position && <Badge label="Position" value={nade.position} />}
            {nade.target && <Badge label="Target" value={nade.target} />}
            {nade.tickrate && <Badge label="Tickrate" value={nade.tickrate} />}
            {typeof nade.jumpThrow !== "undefined" &&
              nade.jumpThrow !== null && (
                <Badge label="Jumpthrow" value={nade.jumpThrow ? "Sí" : "No"} />
              )}
            {typeof nade.runSteps !== "undefined" && nade.runSteps !== null && (
              <Badge label="Run steps" value={String(nade.runSteps)} />
            )}
            {nade.technique && (
              <Badge label="Technique" value={humanize(nade.technique)} />
            )}
            {nade.movement && (
              <Badge label="Movement" value={humanize(nade.movement)} />
            )}
            {nade.precision && (
              <Badge label="Precision" value={humanize(nade.precision)} />
            )}
          </div>

          {/* extra actions and close */}
          <div className="mt-6 flex gap-2 justify-end items-center">
            <button
              onClick={() => {
                copy(constructShareText(nade));
                setCopyResume("Copiado!");
                setTimeout(() => {
                  setCopyResume("Copiar Resumen");
                }, 1000);
              }}
              className={`px-3 py-1 rounded border text-sm nm-button ${
                copyResume.includes("iado") ? "bg-blue-300/20" : ""
              }`}
            >
              {copyResume}
            </button>
            <button
              onClick={() => {
                if (!user) {
                  alert("Inicia sesión para guardar favoritos.");
                  return;
                }
                toggleFavorite(nade.id).catch((e) => {
                  console.error(e);
                  alert("Error guardando favorito");
                });
              }}
              className="px-3 py-1 rounded text-sm nm-button border flex items-center gap-2"
              title={
                isFavorite(nade.id) ? "Quitar favorito" : "Añadir favorito"
              }
            >
              <span aria-hidden>{isFavorite(nade.id) ? "💖" : "🤍"}</span>
              <span className="text-xs">
                {isFavorite(nade.id) ? "Favorito" : "Guardar"}
              </span>
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1 rounded text-sm nm-button border bg-red-400/60"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Badge component (usa useTheme dentro) */
function Badge({ label, value }: { label: string; value: string }) {
  const { theme } = useTheme();
  return (
    <div
      className={`px-2 py-1 rounded-full ${
        theme === "light"
          ? "bg-neutral-800/60 text-neutral-200"
          : "bg-neutral-600/60 text-neutral-200"
      } text-xs flex items-center gap-2`}
    >
      <strong className="text-[11px] text-neutral-300">{label}:</strong>
      <span className="text-[12px]">{value}</span>
    </div>
  );
}
