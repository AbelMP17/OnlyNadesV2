// src/lib/auth.tsx
"use client";

import { onAuthStateChanged, signInWithPopup, signOut, type User } from "firebase/auth";
import { createContext, useContext, useEffect, useState } from "react";
// antes: import { auth, googleProvider } from "./firabase";
// ahora:
import { getFirebaseAuth, googleProvider } from "./firabase";



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
    // getFirebaseAuth() lanza error si Firebase no fue inicializado (y así detectamos la configuración)
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signInGoogle = async () => {
  const auth = getFirebaseAuth();
  await signInWithPopup(auth, googleProvider);
};
const logout = async () => {
  const auth = getFirebaseAuth();
  await signOut(auth);
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
