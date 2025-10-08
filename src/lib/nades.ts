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