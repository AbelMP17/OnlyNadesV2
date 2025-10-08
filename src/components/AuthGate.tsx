// src/components/AuthGate.tsx
"use client";

import { useAuth } from "@/lib/auth";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading, signInGoogle } = useAuth();

  if (loading) return <div className="p-6">Cargando…</div>;

  if (!user) {
    return (
      <div className="p-6 flex flex-col items-center gap-4">
        <p className="text-center">Debes iniciar sesión para acceder.</p>
        <button
          onClick={signInGoogle}
          className="px-4 py-2 rounded bg-black text-white"
        >
          Entrar con Google
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
