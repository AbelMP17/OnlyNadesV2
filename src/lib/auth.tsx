// src/lib/auth.tsx
"use client";

import { onAuthStateChanged, signInWithPopup, signOut, type User } from "firebase/auth";
import { createContext, useContext, useEffect, useState } from "react";
import { auth, googleProvider } from "./firabase";

type AuthCtx = {
  user: User | null;
  loading: boolean;
  signInGoogle: () => Promise<void>;
  logout: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signInGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error("Error en signInGoogle:", err);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Error en logout:", err);
      throw err;
    }
  };

  return (
    <Ctx.Provider value={{ user, loading, signInGoogle, logout }}>
      {children}
    </Ctx.Provider>
  );
}

/**
 * useAuth — hook consumidor
 * Lanza un error claro si se usa fuera de un AuthProvider.
 * Esto hace que llamar `const { user } = useAuth()` sea seguro y tipado.
 */
export const useAuth = (): AuthCtx => {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
};
