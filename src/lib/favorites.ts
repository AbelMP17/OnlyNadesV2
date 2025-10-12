// src/lib/favorites.ts
import { db } from "./firabase";
import {
  collection,
  getDocs,
  query,
  where,
  DocumentData,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import type { NadeDoc } from "./types";
import { Technique, Movement, Precision } from "./types";

/**
 * Convierte un QueryDocumentSnapshot<DocumentData> a un NadeDoc tipado.
 * Hace coerciones mínimas y rellena valores por defecto cuando falta algo.
 */
function docToNade(docSnap: QueryDocumentSnapshot<DocumentData>): NadeDoc {
  const d = docSnap.data();

  // d puede tener tipos de Firestore (Timestamp, etc.). Aquí mapeamos de forma segura.
  const nade: NadeDoc = {
    id: docSnap.id,
    mapSlug: (d.mapSlug as string) ?? "",

    title: typeof d.title === "string" ? d.title : undefined,
    type: typeof d.type === "string" ? d.type : undefined,
    side: typeof d.side === "string" ? d.side : undefined,
    position: typeof d.position === "string" ? d.position : undefined,
    target: typeof d.target === "string" ? d.target : undefined,

    toPos:
      d.toPos && typeof d.toPos === "object" && typeof d.toPos.x === "number" && typeof d.toPos.y === "number"
        ? { x: Number(d.toPos.x), y: Number(d.toPos.y) }
        : null,

    fromPos:
      d.fromPos && typeof d.fromPos === "object" && typeof d.fromPos.x === "number" && typeof d.fromPos.y === "number"
        ? { x: Number(d.fromPos.x), y: Number(d.fromPos.y) }
        : null,

    videoUrl: typeof d.videoUrl === "string" ? d.videoUrl : null,
    tickrate: typeof d.tickrate === "string" ? d.tickrate : null,
    jumpThrow: typeof d.jumpThrow === "boolean" ? d.jumpThrow : undefined,
    runSteps: typeof d.runSteps === "number" ? d.runSteps : null,
    lineupNotes: typeof d.lineupNotes === "string" ? d.lineupNotes : null,
    description: typeof d.description === "string" ? d.description : null,

    technique: typeof d.technique === "string" ? (d.technique as Technique) : null,
    movement: typeof d.movement === "string" ? (d.movement as Movement) : null,
    precision: typeof d.precision === "string" ? (d.precision as Precision) : null,

    createdByUid: typeof d.createdByUid === "string" ? d.createdByUid : undefined,
    createdByName: typeof d.createdByName === "string" ? d.createdByName : undefined,
    createdAt: d.createdAt ?? undefined, // puede ser Timestamp o Date o string - tu type define createdAt?: any
  };

  return nade;
}

/**
 * getNadesByIds - devuelve NadeDoc[] consultando en chunks de hasta 10 ids (límite 'in' de Firestore).
 */
export async function getNadesByIds(ids: string[]): Promise<NadeDoc[]> {
  if (!ids || ids.length === 0) return [];

  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += 10) {
    chunks.push(ids.slice(i, i + 10));
  }

  const results: NadeDoc[] = [];

  for (const chunkIds of chunks) {
    const q = query(collection(db, "nades"), where("__name__", "in", chunkIds));
    const snap = await getDocs(q);
    snap.forEach((docSnap) => {
      results.push(docToNade(docSnap));
    });
  }

  return results;
}
