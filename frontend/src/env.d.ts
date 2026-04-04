/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    user: import('./types/user').User | undefined;
  }
}

interface ImportMetaEnv {
  readonly BACKEND_URL: string;
  /** Vacío en desarrollo = rutas relativas /api vía proxy de Vite (cookie en el origen del frontend). */
  readonly PUBLIC_BACKEND_URL?: string;
  readonly PUBLIC_APP_TITLE: string;
}
