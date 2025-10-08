import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? "",
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);



let _app: FirebaseApp | null = null;

/**
 * Inicializamos firebase SOLO en cliente.
 * Si no hay apiKey (env var), no inicializamos: evita errores en build.
 */
if (typeof window !== "undefined") {
  try {
    if (!getApps().length) {
      if (!firebaseConfig.apiKey) {
        // No inicializamos si no hay API key — así la build/SSR no falla.
        // En el cliente se mostrará un warning y el resto de la app debe manejarlo.
        // Asegúrate de configurar las env vars en Vercel.
        console.warn(
          "[firebase] NEXT_PUBLIC_FIREBASE_API_KEY no está configurada. Firebase no se inicializará."
        );
      } else {
        _app = initializeApp(firebaseConfig);
      }
    } else {
      _app = getApp();
    }
  } catch (err) {
    // No reventar en build/SSR; log para debugging en cliente
    console.warn("[firebase] init error:", err);
    _app = null;
  }
}

/**
 * Devuelve la app inicializada en cliente o lanza error claro.
 */
export function getFirebaseApp(): FirebaseApp {
  if (!_app) {
    throw new Error(
      "Firebase app no inicializada. Asegúrate de que NEXT_PUBLIC_FIREBASE_API_KEY está configurada y que esto se ejecuta en el cliente."
    );
  }
  return _app;
}

/**
 * Devuelve Auth (cliente). Lanza error si no está disponible.
 * Usa esto dentro de componentes client-side (useEffect, providers con 'use client').
 */
export function getFirebaseAuth(): Auth {
  const app = _app;
  if (!app) {
    throw new Error(
      "Firebase Auth no disponible: la app no está inicializada. Revisa las env vars y que tu código se ejecute en cliente."
    );
  }
  return getAuth(app);
}

/**
 * Provider de Google (esto no requiere app)
 */
export const googleProvider = new GoogleAuthProvider();

export const db = getFirestore(app);
