// src/hooks/useFavorites.ts
"use client";

import { useEffect, useState, useCallback } from "react";
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firabase"; // <-- ajusta la ruta si la tienes distinta

type UseFavoritesReturn = {
  favorites: string[];
  loading: boolean;
  busy: boolean;
  error: string | null;
  isFavorite: (nadeId: string) => boolean;
  addFavorite: (nadeId: string) => Promise<boolean>;
  removeFavorite: (nadeId: string) => Promise<boolean>;
  toggleFavorite: (nadeId: string) => Promise<boolean>;
};

function errToMsg(err: unknown): string {
  if (!err) return "Unknown error";
  if (err instanceof Error) return err.message;
  try {
    return String(err);
  } catch {
    return "Unknown error";
  }
}

export function useFavorites(uid?: string | null): UseFavoritesReturn {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [busy, setBusy] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);

    if (!uid) {
      setFavorites([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const col = collection(db, `users/${uid}/favorites`);
      const q = query(col, orderBy("createdAt", "desc"));

      const unsub: Unsubscribe = onSnapshot(
        q,
        (snap) => {
          const ids: string[] = [];
          snap.forEach((d) => ids.push(d.id));
          setFavorites(ids);
          setLoading(false);
        },
        (err) => {
          console.error("[useFavorites] onSnapshot error:", err);
          setError(errToMsg(err));
          setLoading(false);
        }
      );

      return () => unsub();
    } catch (err: unknown) {
      console.error("[useFavorites] subscribe failed:", err);
      setError(errToMsg(err));
      setLoading(false);
    }
  }, [uid]);

  const isFavorite = useCallback(
    (nadeId: string) => favorites.includes(nadeId),
    [favorites]
  );

  const addFavorite = useCallback(
    async (nadeId: string) => {
      setBusy(true);
      setError(null);
      try {
        if (!uid) throw new Error("No authenticated user (uid missing).");
        const ref = doc(db, `users/${uid}/favorites`, nadeId);
        await setDoc(ref, { createdAt: new Date() });
        setBusy(false);
        return true;
      } catch (err: unknown) {
        console.error("[useFavorites] addFavorite error:", err);
        setError(errToMsg(err));
        setBusy(false);
        return false;
      }
    },
    [uid]
  );

  const removeFavorite = useCallback(
    async (nadeId: string) => {
      setBusy(true);
      setError(null);
      try {
        if (!uid) throw new Error("No authenticated user (uid missing).");
        const ref = doc(db, `users/${uid}/favorites`, nadeId);
        await deleteDoc(ref);
        setBusy(false);
        return true;
      } catch (err: unknown) {
        console.error("[useFavorites] removeFavorite error:", err);
        setError(errToMsg(err));
        setBusy(false);
        return false;
      }
    },
    [uid]
  );

  const toggleFavorite = useCallback(
    async (nadeId: string) => {
      if (isFavorite(nadeId)) return removeFavorite(nadeId);
      return addFavorite(nadeId);
    },
    [isFavorite, addFavorite, removeFavorite]
  );

  return {
    favorites,
    loading,
    busy,
    error,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
  };
}
