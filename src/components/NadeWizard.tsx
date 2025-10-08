/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/NadeWizard.tsx
"use client";

import React, { useMemo, useState } from "react";
import type { Pos, NadeDoc } from "@/lib/types";
import { createNade as createNadeFn } from "@/lib/nades";
import { useAuth } from "@/lib/auth";
import { ADMIN_UID } from "@/lib/constants";
import MapEditor from "@/components/MapEditor";
import { useRouter } from "next/navigation";
import UiSelect from "./UiSelect";
import ToggleSwitch from "./ToggleSwitch";
import RunStepper from "./RunStepper";
import type { Technique, Movement, Precision } from "@/lib/types";

export default function NadeWizard({
  open,
  onClose,
  mapSlug,
  mapImage,
  existingNades = [],
}: {
  open: boolean;
  onClose: () => void;
  mapSlug: string;
  mapImage: string;
  existingNades?: NadeDoc[];
}) {
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.uid === ADMIN_UID;

  // state hooks (declarados al principio)
  const [step, setStep] = useState(0);
  const [toPos, setToPos] = useState<Pos | null>(null);
  const [tempTo, setTempTo] = useState<Pos | null>(null);
  const [selectedClusterKey, setSelectedClusterKey] = useState<string | null>(
    null
  );
  const [clusterItems, setClusterItems] = useState<NadeDoc[] | null>(null);
  const [fromPos, setFromPos] = useState<Pos | null>(null);
  const [tempFrom, setTempFrom] = useState<Pos | null>(null);
  const [selectedFromNade, setSelectedFromNade] = useState<NadeDoc | null>(
    null
  );
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    type: "smoke",
    side: "T",
    position: "",
    target: "",
    videoUrl: "",
    imageUrl: "",
    tickrate: "",
    jumpThrow: false,
    runSteps: undefined as number | undefined,
    lineupNotes: "",
    description: "",
    technique: "",
    movement: "",
    precision: "precise",
  });

  const [wizardErrors, setWizardErrors] = useState<string[]>([]);

  /* ---------------------------
     Hooks/derived values (MUST be *before* any early returns)
     --------------------------- */

  const steps = ["Video", "Position (To)", "Position (From)", "Information"];

  const availableFroms = useMemo(() => {
    if (!clusterItems) return [];
    return clusterItems.filter((n) => n.fromPos).map((n) => n);
  }, [clusterItems]);

  /* YouTube helpers (pure functions - ok here) */
  function getYouTubeId(url?: string | null): string | null {
    if (!url) return null;
    const m = url.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/);
    return m ? m[1] : null;
  }
  function isValidYouTubeUrl(url?: string | null) {
    return !!getYouTubeId(url);
  }
  function youtubeEmbedUrl(videoId: string) {
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&rel=0&modestbranding=1&playsinline=1&loop=1&playlist=${videoId}`;
  }
  function isDirectVideo(url?: string | null) {
    if (!url) return false;
    return /\.(mp4|webm|mov|ogg)(\?.*)?$/i.test(url);
  }

  /* ---------------------------
     Validation helpers
     --------------------------- */
  const FIELD_LABELS: Record<string, string> = {
    videoUrl: "URL del video",
    toPos: "Posición destino (To)",
    fromPos: "Posición origen (From)",
    title: "Título",
    type: "Tipo de granada",
    side: "Equipo (T/CT)",
    position: "Posición (texto)",
    target: "Target",
    tickrate: "Tickrate",
    runSteps: "Pasos de carrera (runSteps)",
    technique: "Técnica",
    movement: "Movimiento",
    precision: "Precisión",
    description: "Descripción",
  };

  function getMissingFieldsForStep(s: number) {
    const missing: string[] = [];

    if (s === 0) {
      if (!form.videoUrl || !form.videoUrl.trim()) {
        missing.push(FIELD_LABELS.videoUrl);
      } else if (!isValidYouTubeUrl(form.videoUrl)) {
        missing.push(FIELD_LABELS.videoUrl + " (URL inválida de YouTube)");
      }
    }

    if (s === 1) {
      if (!toPos) missing.push(FIELD_LABELS.toPos);
    }

    if (s === 2) {
      if (!fromPos) missing.push(FIELD_LABELS.fromPos);
    }

    if (s === 3) {
      const required = [
        "title",
        "type",
        "side",
        "position",
        "target",
        "tickrate",
        "runSteps",
        "technique",
        "movement",
        "precision",
        "description",
      ];
      for (const key of required) {
        const val = (form as any)[key]; // aqui es seguro porque proviene de `form` local
        if (key === "runSteps") {
          if (val === undefined || val === null || Number.isNaN(Number(val)))
            missing.push(FIELD_LABELS.runSteps);
        } else {
          if (
            val === undefined ||
            val === null ||
            (typeof val === "string" && !(val as string).trim())
          ) {
            missing.push(FIELD_LABELS[key]);
          }
        }
      }
      if (!toPos) missing.push(FIELD_LABELS.toPos);
      if (!fromPos) missing.push(FIELD_LABELS.fromPos);

      if (!form.videoUrl || !form.videoUrl.trim()) {
        missing.push(FIELD_LABELS.videoUrl);
      } else if (!isValidYouTubeUrl(form.videoUrl)) {
        missing.push(FIELD_LABELS.videoUrl + " (URL inválida de YouTube)");
      }
    }

    return missing;
  }

  function validateStep(s: number) {
    const missing = getMissingFieldsForStep(s);
    setWizardErrors(missing);
    return missing.length === 0;
  }

  /* ---------------------------
     Early returns (UI gating)
     --------------------------- */
  if (!open) return null;
  if (!isAdmin) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className="bg-white p-6 rounded">
          Solo el admin puede crear nades.{" "}
          <button className="ml-3 px-3 py-1 border" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  /* ---------------------------
     Handlers
     --------------------------- */
  function handleSelectCluster(
    clusterKey: string,
    items: NadeDoc[],
    center: Pos
  ) {
    setSelectedClusterKey(clusterKey);
    setClusterItems(items);
    const firstTo = items.find((i) => i.toPos)?.toPos ?? center;
    setToPos(firstTo ?? center);
    setTempTo(firstTo ?? center);
    setFromPos(null);
    setTempFrom(null);
    setSelectedFromNade(null);
  }

  function handlePlace(which: "to" | "from", pos: Pos) {
    if (which === "to") {
      setSelectedClusterKey(null);
      setClusterItems(null);
      setToPos(pos);
      setTempTo(pos);
      setFromPos(null);
      setTempFrom(null);
      setSelectedFromNade(null);
    } else {
      setFromPos(pos);
      setTempFrom(pos);
      setSelectedFromNade(null);
    }
  }

  function handleSelectFrom(nade: NadeDoc) {
    if (!nade.fromPos) return;
    setSelectedFromNade(nade);
    setFromPos(nade.fromPos);
    setTempFrom(nade.fromPos);
  }

  async function handleSubmit() {
    if (!user) {
      alert("Debes iniciar sesión");
      return;
    }
    if (!toPos || !fromPos) {
      alert("Selecciona toPos y fromPos");
      return;
    }

    if (
      !form.videoUrl ||
      !form.videoUrl.trim() ||
      !isValidYouTubeUrl(form.videoUrl)
    ) {
      setWizardErrors([FIELD_LABELS.videoUrl + " (URL inválida de YouTube)"]);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setLoading(true);
    // validar y normalizar los campos technique/movement/precision
    const ALLOWED_TECHNIQUES = [
      "left_click",
      "right_click",
      "left_right_click",
      "jump_left",
      "jump_right",
      "jump_left_right",
    ] as const;
    const ALLOWED_MOVEMENTS = [
      "stationary",
      "running",
      "walking",
      "crouched",
      "crouched_walking",
    ] as const;
    const ALLOWED_PRECISIONS = ["precise", "loose", "very_precise"] as const;

    function normalizeTechnique(v?: string | null): Technique | undefined {
      if (!v) return undefined;
      return ALLOWED_TECHNIQUES.includes(v as any)
        ? (v as Technique)
        : undefined;
    }
    function normalizeMovement(v?: string | null): Movement | undefined {
      if (!v) return undefined;
      return ALLOWED_MOVEMENTS.includes(v as any) ? (v as Movement) : undefined;
    }
    function normalizePrecision(v?: string | null): Precision | undefined {
      if (!v) return undefined;
      return ALLOWED_PRECISIONS.includes(v as any)
        ? (v as Precision)
        : undefined;
    }

    const payload: Partial<NadeDoc> & {
      createdByUid?: string;
      createdByName?: string;
    } = {
      mapSlug,
      title: form.title || "Untitled",
      type: form.type,
      side: form.side,
      position: form.position || "",
      target: form.target || "",
      toPos,
      fromPos,
      description: form.description || "",
      videoUrl: form.videoUrl || undefined,
      tickrate: form.tickrate || undefined,
      jumpThrow: !!form.jumpThrow,
      runSteps: form.runSteps ?? undefined,
      lineupNotes: form.lineupNotes || undefined,
      technique: normalizeTechnique(form.technique) ?? undefined,
      movement: normalizeMovement(form.movement) ?? undefined,
      precision: normalizePrecision(form.precision) ?? undefined,
      createdByUid: user.uid,
      createdByName: user.displayName ?? user.email ?? "Admin",
    };

    try {
      const id = await createNadeFn(payload as any);
      setLoading(false);
      alert("Nade creada: " + id);
      onClose?.();
      window.location.reload();

      try {
        if (router && typeof (router as any).refresh === "function") {
          (router as any).refresh();
        } else if (typeof window !== "undefined") {
          window.location.reload();
        }
      } catch {
        if (typeof window !== "undefined") window.location.reload();
      }
    } catch (error) {
      console.error(error);
      setLoading(false);
      alert("Error creando nade");
    }
  }

  /* ---------------------------
     Preview computed values
     --------------------------- */
  const youTubeId = useMemo(() => getYouTubeId(form.videoUrl), [form.videoUrl]);
  const youtubeEmbed = useMemo(
    () => (youTubeId ? youtubeEmbedUrl(youTubeId) : ""),
    [youTubeId]
  );
  const isDirect = useMemo(() => isDirectVideo(form.videoUrl), [form.videoUrl]);
  const hasUrl = !!(form.videoUrl && form.videoUrl.trim());
  const urlValid = hasUrl ? youTubeId !== null || isDirect : false;

  /* options */
  const typeOptions = [
    { value: "smoke", label: "Smoke" },
    { value: "flash", label: "Flash" },
    { value: "molotov", label: "Molotov" },
    { value: "he", label: "HE" },
    { value: "decoy", label: "Decoy" },
  ];
  const sideOptions = [
    { value: "T", label: "T" },
    { value: "CT", label: "CT" },
  ];
  const tickrateOptions = [
    { value: "", label: "Tickrate" },
    { value: "64", label: "64" },
    { value: "128", label: "128" },
  ];
  const techniqueOptions = [
    { value: "", label: "Select technique" },
    { value: "left_click", label: "Left Click" },
    { value: "right_click", label: "Right Click" },
    { value: "left_right_click", label: "Left+Right Click" },
    { value: "jump_left", label: "Jump + Left Click" },
    { value: "jump_right", label: "Jump + Right Click" },
    { value: "jump_left_right", label: "Jump + Left+Right Click" },
  ];
  const movementOptions = [
    { value: "", label: "Select movement" },
    { value: "stationary", label: "Stationary" },
    { value: "running", label: "Running" },
    { value: "walking", label: "Walking" },
    { value: "crouched", label: "Crouched" },
    { value: "crouched_walking", label: "Crouched Walking" },
  ];
  const precisionOptions = [
    { value: "precise", label: "Precise" },
    { value: "loose", label: "Loose" },
    { value: "very_precise", label: "Very Precise" },
  ];

  /* ---------------------------
     Render
     --------------------------- */
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 overflow-auto">
      <div className="bg-neutral-900 text-white rounded-lg max-w-4xl w-full p-4">
        <div className="flex gap-2 items-center mb-4">
          {steps.map((s, i) => (
            <div
              key={s}
              className={`px-3 py-1 rounded ${
                i === step
                  ? "bg-green-600"
                  : "bg-neutral-800 text-neutral-300 opacity-35"
              }`}
            >
              {s}
            </div>
          ))}
        </div>

        <div className="bg-neutral-800 p-3 rounded mb-4">
          {step === 0 && (
            <div className="space-y-3">
              <div>
                <input
                  value={form.videoUrl}
                  onChange={(e) => {
                    setForm({ ...form, videoUrl: e.target.value });
                    // si hay errores relacionados con la URL, limpiarlos en cambio de input
                    setWizardErrors((errs) =>
                      errs.filter(
                        (er) => !er.toLowerCase().includes("url del video")
                      )
                    );
                  }}
                  placeholder="YouTube URL"
                  className="w-full p-2 rounded bg-white/5"
                />
                <div className="text-xs text-neutral-400 mt-1">
                  Introduce una URL válida de YouTube (youtu.be/ID o
                  youtube.com/watch?v=ID).
                </div>
              </div>

              {/* PREVIEW BOX */}
              <div className="mt-2">
                {hasUrl && !urlValid && (
                  <div className="text-sm text-yellow-300">
                    La URL introducida no es válida para previsualizar.
                  </div>
                )}

                {youTubeId && (
                  <div className="mt-2 aspect-video rounded overflow-hidden bg-black">
                    <iframe
                      src={youtubeEmbedUrl(
                        getYouTubeId(youtubeEmbed) ?? youTubeId
                      )}
                      title={"Nade preview"}
                      allow="autoplay; encrypted-media; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full border-0 pointer-events-none"
                    />
                  </div>
                )}

                {!youTubeId && isDirect && (
                  <div className="mt-2 aspect-video rounded overflow-hidden bg-black flex items-center justify-center">
                    <video
                      src={form.videoUrl ?? undefined}
                      controls
                      playsInline
                      preload="metadata"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 1 && (
            <>
              <p className="text-sm text-neutral-300 mb-2">
                Selecciona un <strong>To</strong> existente (clic en el badge) o
                crea uno nuevo clicando en el mapa. El badge seleccionado
                quedará marcado.
              </p>
              <MapEditor
                mapImage={mapImage}
                nades={existingNades}
                selectionMode="select-to"
                allowTempMarker
                tempMarker={tempTo}
                tempMarkerMode="to"
                onTempPlace={(which, pos) => {
                  if (which === "to") {
                    setToPos(pos);
                    setTempTo(pos);
                  }
                }}
                onSelectCluster={(k, items, center) =>
                  handleSelectCluster(k, items, center)
                }
              />
              <div className="mt-2 text-sm">
                To:{" "}
                {toPos
                  ? `${toPos.x.toFixed(1)}%, ${toPos.y.toFixed(1)}%`
                  : "Sin seleccionar"}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-sm text-neutral-300 mb-2">
                Selecciona un <strong>From</strong> relacionado al toPos elegido
                (clic en un origin) o crea uno nuevo clicando en el mapa. En
                este paso solo se muestran los fromPos relacionados con el toPos
                seleccionado.
              </p>

              <MapEditor
                mapImage={mapImage}
                nades={existingNades}
                interactive
                selectionMode="select-from"
                forceExpandKey={selectedClusterKey ?? undefined}
                singleToPos={
                  selectedClusterKey ? undefined : toPos ?? tempTo ?? null
                }
                onSelectFrom={(n) => handleSelectFrom(n)}
                allowTempMarker
                tempMarker={tempFrom}
                tempMarkerMode="from"
                onTempPlace={(which, pos) => {
                  if (which === "from") {
                    setFromPos(pos);
                    setTempFrom(pos);
                  }
                }}
              />

              <div className="mt-2 text-sm">
                From:{" "}
                {fromPos
                  ? `${fromPos.x.toFixed(1)}%, ${fromPos.y.toFixed(1)}%`
                  : "Sin seleccionar"}
              </div>

              {availableFroms.length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {availableFroms.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => handleSelectFrom(n)}
                      className={`p-2 rounded text-left bg-white/5 ${
                        selectedFromNade?.id === n.id
                          ? "ring-2 ring-green-500"
                          : ""
                      }`}
                    >
                      <div className="font-semibold">{n.title}</div>
                      <div className="text-xs text-neutral-400">
                        {n.position} · {n.type}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Título"
                className="appearance-none w-full p-2 rounded bg-white/5 text-sm border border-white/10
             focus:outline-none focus:ring-2 focus:ring-green-500 relative"
              />

              <div className="grid grid-cols-2 gap-2">
                <UiSelect
                  value={form.type ?? ""}
                  onChange={(v) => setForm({ ...form, type: v })}
                  options={typeOptions}
                  placeholder="Tipo"
                />
                <UiSelect
                  value={form.side ?? ""}
                  onChange={(v) => setForm({ ...form, side: v })}
                  options={sideOptions}
                  placeholder="Side"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  value={form.position}
                  onChange={(e) =>
                    setForm({ ...form, position: e.target.value })
                  }
                  placeholder="Posición (texto)"
                  className="appearance-none w-full p-2 rounded bg-white/5 text-sm border border-white/10
             focus:outline-none focus:ring-2 focus:ring-green-500 relative"
                />
                <input
                  value={form.target}
                  onChange={(e) => setForm({ ...form, target: e.target.value })}
                  placeholder="Target"
                  className="appearance-none w-full p-2 rounded bg-white/5 text-sm border border-white/10
             focus:outline-none focus:ring-2 focus:ring-green-500 relative"
                />
              </div>

              <div className="grid grid-cols-3 gap-2 justify-center items-center">
                {/* tickrate con UiSelect */}
                <UiSelect
                  value={form.tickrate ?? ""}
                  onChange={(v) => setForm({ ...form, tickrate: v })}
                  options={tickrateOptions}
                  placeholder="Tickrate"
                />

                <div>
                  <label className="block text-xs text-neutral-300 mb-1 text-center">
                    Run steps
                  </label>
                  <RunStepper
                    value={form.runSteps ?? 0}
                    onChange={(v) => setForm({ ...form, runSteps: v })}
                    min={0}
                    max={200}
                    ariaLabel="Run steps"
                  />
                </div>

                <div className="flex flex-col items-start ">
                  <label className="block text-xs text-neutral-300 mb-1 text-center w-full">
                    Jumpthrow
                  </label>
                  <ToggleSwitch
                    checked={!!form.jumpThrow}
                    onChange={(v) => setForm({ ...form, jumpThrow: v })}
                    label=""
                    ariaLabel="Jumpthrow toggle"
                  />
                </div>
              </div>

              {/* NUEVOS selects: Technique, Movement, Precision (UiSelect) */}
              <div className="grid grid-cols-3 gap-2 mt-2">
                <UiSelect
                  value={form.technique ?? ""}
                  onChange={(v) => setForm({ ...form, technique: v })}
                  options={techniqueOptions}
                  placeholder="Technique"
                />

                <UiSelect
                  value={form.movement ?? ""}
                  onChange={(v) => setForm({ ...form, movement: v })}
                  options={movementOptions}
                  placeholder="Movement"
                />

                <UiSelect
                  value={form.precision ?? ""}
                  onChange={(v) => setForm({ ...form, precision: v })}
                  options={precisionOptions}
                  placeholder="Precision"
                />
              </div>

              <input
                value={form.lineupNotes}
                onChange={(e) =>
                  setForm({ ...form, lineupNotes: e.target.value })
                }
                placeholder="Notas de alineación (opcional)"
                className="appearance-none w-full p-2 rounded bg-white/5 text-sm border border-white/10
             focus:outline-none focus:ring-2 focus:ring-green-500 relative"
              />
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Descripción completa"
                className="appearance-none w-full p-2 rounded bg-white/5 text-sm border border-white/10
             focus:outline-none focus:ring-2 focus:ring-green-500 relative"
              />
            </div>
          )}
        </div>

        {wizardErrors.length > 0 && (
          <div className="mb-3 p-3 rounded bg-red-900/60 text-sm text-red-200">
            <strong className="block mb-1">Faltan campos obligatorios:</strong>
            <ul className="list-disc list-inside">
              {wizardErrors.map((err) => (
                <li key={err}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex gap-2 justify-between">
          <button
            onClick={onClose}
            className="px-3 py-2 rounded border nm-button"
          >
            Cancelar
          </button>
          <div className="flex gap-2">
            {step > 0 && (
              <button
                onClick={() => {
                  setWizardErrors([]);
                  setStep((s) => s - 1);
                }}
                className="px-3 py-2 rounded border nm-button"
              >
                Anterior
              </button>
            )}
            {step < steps.length - 1 && (
              <button
                onClick={() => {
                  setWizardErrors([]);
                  if (!validateStep(step)) return;
                  setStep((s) => s + 1);
                }}
                className="px-3 py-2 rounded bg-green-600 nm-button"
              >
                Siguiente
              </button>
            )}
            {step === steps.length - 1 && (
              <button
                onClick={async () => {
                  setWizardErrors([]);
                  if (!validateStep(3)) return;
                  await handleSubmit();
                }}
                disabled={loading}
                className="px-3 py-2 rounded bg-blue-600"
              >
                {loading ? "Enviando..." : "Enviar"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
