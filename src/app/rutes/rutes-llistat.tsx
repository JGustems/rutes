"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

type Ruta = {
  id: string;
  nom: string;
  categoria: string;
  ubicacio: string | null;
  distancia_km: number | null;
  desnivell_positiu_m: number | null;
  bidireccional: boolean;
  num_checkpoints: number;
};

const CATEGORIA_LABELS: Record<string, string> = {
  km_vertical: "Km vertical",
  trail_running: "Trail running",
  cross: "Cross",
  btt: "BTT",
  carretera: "Carretera",
};

const CATEGORIA_COLORS: Record<string, string> = {
  km_vertical: "bg-pi",
  trail_running: "bg-cel",
  cross: "bg-terra",
  btt: "bg-pi",
  carretera: "bg-cel",
};

const ORDENACIONS = [
  { value: "recents", label: "Més recents" },
  { value: "nom", label: "Nom (A-Z)" },
  { value: "distancia", label: "Distància" },
  { value: "desnivell", label: "Desnivell" },
];

export default function RutesLlistat({ rutes }: { rutes: Ruta[] }) {
  const [cerca, setCerca] = useState("");
  const [ordenacio, setOrdenacio] = useState("recents");

  const rutesFiltrades = useMemo(() => {
    let resultat = rutes;

    if (cerca.trim()) {
      const text = cerca.trim().toLowerCase();
      resultat = resultat.filter(
        (r) =>
          r.nom.toLowerCase().includes(text) ||
          (r.ubicacio ?? "").toLowerCase().includes(text)
      );
    }

    resultat = [...resultat];
    switch (ordenacio) {
      case "nom":
        resultat.sort((a, b) => a.nom.localeCompare(b.nom));
        break;
      case "distancia":
        resultat.sort((a, b) => (b.distancia_km ?? 0) - (a.distancia_km ?? 0));
        break;
      case "desnivell":
        resultat.sort(
          (a, b) => (b.desnivell_positiu_m ?? 0) - (a.desnivell_positiu_m ?? 0)
        );
        break;
    }

    return resultat;
  }, [rutes, cerca, ordenacio]);

  return (
    <div>
      <input
        type="text"
        value={cerca}
        onChange={(e) => setCerca(e.target.value)}
        placeholder="Cerca per nom o ubicació..."
        className="w-full border border-vora rounded-lg px-3 py-2 text-sm text-text-principal bg-superficie focus:outline-none focus:border-pi mb-3"
      />

      <div className="flex items-center justify-between mb-6">
        <p className="text-xs text-text-secundari">
          {rutesFiltrades.length} {rutesFiltrades.length === 1 ? "ruta" : "rutes"}
        </p>
        <select
          value={ordenacio}
          onChange={(e) => setOrdenacio(e.target.value)}
          className="text-xs border border-vora rounded-lg px-2 py-1.5 text-text-principal bg-superficie focus:outline-none focus:border-pi"
        >
          {ORDENACIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {rutesFiltrades.length === 0 ? (
        <div className="bg-superficie border border-vora rounded-card p-12 text-center">
          <p className="text-text-secundari">
            Cap ruta coincideix amb la cerca o el filtre.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {rutesFiltrades.map((r) => (
            <Link
              key={r.id}
              href={`/rutes/${r.id}`}
              className="bg-superficie border border-vora rounded-card overflow-hidden hover:shadow-sm transition-shadow block"
            >
              <div className={`h-20 ${CATEGORIA_COLORS[r.categoria] ?? "bg-pi"} flex items-end p-3`}>
                <span className="bg-white/90 text-text-principal text-xs font-medium px-2.5 py-1 rounded-lg">
                  {CATEGORIA_LABELS[r.categoria] ?? r.categoria}
                </span>
              </div>
              <div className="p-4">
                <p className="text-base font-medium text-text-principal mb-1">{r.nom}</p>
                <p className="text-xs text-text-secundari mb-3">
                  {r.ubicacio ? `${r.ubicacio} · ` : ""}
                  {r.distancia_km ? `${r.distancia_km} km · ` : ""}
                  {r.desnivell_positiu_m ? `+${r.desnivell_positiu_m} m · ` : ""}
                  {r.num_checkpoints} punts de control
                </p>
                <div className="flex gap-2">
                  {r.bidireccional && (
                    <span className="bg-fons text-text-secundari text-xs px-2 py-1 rounded-lg">
                      Bidireccional
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
