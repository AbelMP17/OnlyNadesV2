// src/components/MarkerPreview.tsx
"use client";

import React from "react";
import type { NadeDoc } from "@/lib/types";

export default function MarkerPreview({
  nade,
  coords,
  onOpen,
  useThumbForYouTube = false,
}: {
  nade: NadeDoc | null;
  coords?: { x: number; y: number } | undefined;
  onOpen?: (n: NadeDoc) => void;
  useThumbForYouTube?: boolean;
}) {
  if (!nade || !coords) return null;

  const left = coords.x;
  const top = coords.y - 8;
  const style: React.CSSProperties = {
    position: "absolute",
    left,
    top,
    transform: "translate(-50%, -100%)",
    zIndex: 100,
    pointerEvents: "auto",
    width: 320,
    maxWidth: "calc(100vw - 24px)",
  };

  const videoUrl = nade.videoUrl ?? "";
  const directVideo = isDirectVideo(videoUrl);
  const youtubeId = getYouTubeId(videoUrl);
  const isYouTubeVideo = !!youtubeId;

  return (
    <div style={style}>
      <div className="bg-neutral-900 text-white rounded shadow-lg overflow-hidden" style={{ pointerEvents: "auto" }}>
        <div className="w-full aspect-video bg-black">
          {directVideo ? (
            <video
              src={videoUrl}
              className="w-full h-full object-cover"
              muted
              autoPlay
              loop
              playsInline
              preload="metadata"
            />
          ) : isYouTubeVideo ? (
            useThumbForYouTube ? (
              <img
                src={youtubeThumbFromId(youtubeId!)}
                alt={nade.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <iframe
                src={youtubeEmbedFromId(youtubeId!)}
                title={nade.title}
                className="w-full h-full"
                frameBorder="0"
                allow="autoplay; encrypted-media; picture-in-picture"
                loading="lazy"
              />
            )
          ) : nade.imageUrl ? (
            <img src={nade.imageUrl} alt={nade.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-neutral-400">No media</div>
          )}
        </div>

        <div className="p-2 text-xs capitalize">
          <div className="font-semibold text-sm line-clamp-1">{nade.title}</div>
          <div className="text-neutral-300 text-[11px]">{nade.position ?? ""} · {nade.type} · {nade.side}</div>
          <div className="text-neutral-300 text-[11px]">{nade.movement ?? ""} · {nade.technique} · RunSteps {nade.runSteps}</div>
        </div>
      </div>
    </div>
  );
}

/* Helpers */
function isDirectVideo(url?: string) {
  if (!url) return false;
  return /\.(mp4|webm|mov|ogg)(\?.*)?$/i.test(url);
}

function getYouTubeId(url?: string) {
  if (!url) return null;
  const m = url.match(/(?:v=|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
}

function youtubeEmbedFromId(id: string) {
  return `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&autoplay=1&mute=1&controls=0&loop=1&playlist=${id}`;
}

function youtubeThumbFromId(id: string) {
  return `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
}
