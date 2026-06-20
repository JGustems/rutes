// ============================================================
// Gestio de l'activitat en curs al localStorage del navegador.
// Aixo permet que l'activitat sobrevisqui si es tanca la
// pestanya, es perd connexio, etc. Nomes es desa al servidor
// (Neon) quan l'activitat es sincronitza/finalitza.
// ============================================================

const STORAGE_KEY = "activitat_en_curs";

export type PasLocal = {
  checkpointId: string;
  detectatEl: string; // ISO timestamp
  font: "nfc" | "ble" | "manual";
};

export type ActivitatLocal = {
  localId: string;
  routeId: string;
  sentit: "anada" | "tornada";
  iniciadaEl: string;
  fontInici: "nfc" | "ble" | "manual" | null;
  passos: PasLocal[];
  checkpointsEsperat: { checkpointId: string; ordre: number; tagCodi: string | null }[];
};

export function generarUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function desarActivitat(activitat: ActivitatLocal) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(activitat));
}

export function obtenirActivitat(): ActivitatLocal | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ActivitatLocal;
  } catch {
    return null;
  }
}

export function esborrarActivitat() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function seguentCheckpointEsperat(activitat: ActivitatLocal) {
  const idsFets = new Set(activitat.passos.map((p) => p.checkpointId));
  return activitat.checkpointsEsperat.find((c) => !idsFets.has(c.checkpointId)) ?? null;
}

export function activitatCompletada(activitat: ActivitatLocal): boolean {
  return seguentCheckpointEsperat(activitat) === null;
}
