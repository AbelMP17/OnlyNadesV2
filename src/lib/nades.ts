// src/lib/nades.ts
import {
  addDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "./firabase";
import { NadeDoc } from "./types";

export async function getNadesByMap(mapSlug: string): Promise<NadeDoc[]> {
  const q = query(collection(db, "nades"), where("mapSlug", "==", mapSlug), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<NadeDoc, "id">) }));
}

export async function getNade(id: string): Promise<NadeDoc | null> {
  const ref = doc(db, "nades", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<NadeDoc, "id">) };
}


export async function createNade(payload: Partial<NadeDoc>) {
  const ref = await addDoc(collection(db, "nades"), {
    ...payload,
    createdAt: Date.now(),
    updatedAt: Date.now()
  });
  return ref.id;
}

/** Nuevo: devuelve conteo por tipo.
 *  Si pasas mapSlug solo contará ese mapa; si no, contará todas.
 */
export async function getTypeCounts(mapSlug?: string): Promise<Record<string, number>> {
  const col = collection(db, "nades");
  const q = mapSlug ? query(col, where("mapSlug", "==", mapSlug)) : query(col);

  const snap = await getDocs(q);
  const counts: Record<string, number> = {};

  snap.forEach((d) => {
    const data = d.data() as Record<string, unknown>;
    const t = typeof data.type === "string" && data.type.trim() !== "" ? data.type : "unknown";
    counts[t] = (counts[t] ?? 0) + 1;
  });

  return counts;
}