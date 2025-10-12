// src/app/profile/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useFavorites } from "@/hooks/useFavorites";
import { getNadesByIds } from "@/lib/favorites";
import type { NadeDoc } from "@/lib/types";
import NadeModal from "@/components/NadeModal";
import { useTheme } from "@/context/ThemeContext";

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const uid = user?.uid ?? null;
  const { favorites, loading: favLoading, removeFavorite } = useFavorites(uid);
  const [nades, setNades] = useState<NadeDoc[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [openNade, setOpenNade] = useState<NadeDoc | null>(null);
  const { theme } = useTheme();

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

  /* --------------------
       Media source calc
       -------------------- */

  useEffect(() => {
    let mounted = true;
    async function load() {
      setError(null);
      setLoading(true);
      try {
        if (!favorites || favorites.length === 0) {
          if (mounted) setNades([]);
        } else {
          const res = await getNadesByIds(favorites);
          if (mounted) setNades(res);
        }
      } catch (err) {
        console.error("Error loading favorite nades:", err);
        if (mounted) setError("Error cargando favoritos");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [favorites]);

  if (authLoading) {
    return <p>Cargando usuario…</p>;
  }

  if (!user) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-2">Tu perfil</h1>
        <p>Inicia sesión para ver y gestionar tus favoritos.</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-6">
        <div className={`rounded-lg p-6 ${theme === "light" ? "bg-white/80 text-black" : "bg-gradient-to-r from-neutral-800 to-neutral-900 text-white"} shadow-lg`}>
        <h1 className="text-3xl font-extrabold">Perfil</h1>
        <p className="mt-2 text-sm opacity-80">Hello {user.displayName}, Here is your favorite <b>Nades</b></p>
      </div>
      </div>

      <section
        className={`p-4 rounded ${
          theme === "light" ? "bg-white/60" : "bg-white/5"
        }`}
      >
        <h2 className="text-xl font-semibold mb-3">
          Favoritos ({favorites.length})
        </h2>

        {favLoading || loading ? (
          <div className="text-sm text-neutral-400">Cargando favoritos…</div>
        ) : error ? (
          <div className="text-sm text-red-400">{error}</div>
        ) : nades.length === 0 ? (
          <div className="text-sm text-neutral-400">
            Aún no has guardado ninguna granada como favorita.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {nades.map((n) => {
              const youtubeId = getYouTubeId(n.videoUrl ?? undefined);
              const iframeSrc = youtubeId ? youtubeEmbedUrl(youtubeId) : "";

              return (
                <div
                  key={n.id}
                  className={`hover:bg-neutral-900/30 hover:text-white p-3 rounded flex flex-col hover:shadow-lg  gap-3 ${
                    theme === "light" ? "text-black hover:shadow-gray-700" : "text-white hover:shadow-gray-700"
                  }`}
                >
                  <div>
                    {isDirectVideo(n.videoUrl ?? undefined) ? (
                      <div className="mt-2 aspect-video">
                        <video
                          src={n.videoUrl ?? undefined}
                          autoPlay
                          muted
                          playsInline
                          loop
                          controls={false}
                          className="w-full h-full object-cover rounded"
                        />
                      </div>
                    ) : isYouTube(n.videoUrl ?? undefined) && youtubeId ? (
                      <div className="mt-2 aspect-video rounded overflow-hidden bg-black">
                        <iframe
                          src={iframeSrc}
                          title={n.title ?? "Nade preview"}
                          allow="autoplay; encrypted-media; picture-in-picture"
                          allowFullScreen
                          className="w-full h-full border-0 pointer-events-none"
                        />
                      </div>
                    ) : null}
                  </div>
                    <div className="flex justify-between items-center w-full">
                      <div>
                        <div className="font-semibold">
                          {n.title ?? "Untitled"}
                        </div>
                        <div className="text-xs">
                          {n.mapSlug} · {n.type ?? "—"}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => setOpenNade(n)}
                          className="px-2 py-1 rounded nm-button border text-sm"
                        >
                          Ver
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              await removeFavorite(n.id);
                            } catch (err) {
                              console.error(err);
                              alert("Error al quitar favorito");
                            }
                          }}
                          className="px-2 py-1 rounded nm-button border text-sm hover:bg-red-400/40 hover:border-red-400"
                        >
                          Quitar
                        </button>
                      </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {openNade && (
        <NadeModal nade={openNade} onClose={() => setOpenNade(null)} />
      )}
    </div>
  );
}
