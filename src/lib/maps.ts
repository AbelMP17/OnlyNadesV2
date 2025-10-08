// src/lib/maps.ts
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "./firabase";
import { MapDoc } from "./types";

export async function getMaps(): Promise<MapDoc[]> {
  const q = query(collection(db, "maps"), orderBy("order", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<MapDoc, "id">),
  }));
}
