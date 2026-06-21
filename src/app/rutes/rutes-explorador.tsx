"use client";

import { useState, useMemo } from "react";
import AllRoutesMap from "@/components/all-routes-map-wrapper";
import RutesLlistat from "./rutes-llistat";

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

type RutaAmbTrack = {
  id: string;
  nom: string;
  categoria: string;
  geojson: any | null;
};

const CATEGORIA_LABELS: Record<string, string> = {
  km_vertical: "Km vertical",
  trail_running: "Trail running",
  cross: "Cross",
  btt: "BTT",
  carretera: "Carretera",
};

export default function RutesExplorador({
  rutes,
  rutesAmbTrack,
}: {
  rutes: Ruta[];
  rutesAmbTrack: RutaAmbTrack[];
}) {
  const [categoria, setCategoria] = useState<string>("totes");

  const categories = useMemo(() => {
    const presents = new Set(rutes.map((r) => r.categoria));
    return Object.entries(CATEGORIA_LABELS).filter(([key]) => presents.has(key));
  }, [rutes]);

  const rutesFiltrades = useMemo(() => {
    if (categoria === "totes") return rutes;
    return rutes.filter((r) => r.categoria === categoria);
  }, [rutes, categoria]);

  const rutesAmbTrackFiltrades = useMemo(() => {
    if (categoria === "totes") return rutesAmbTrack;
    return rutesAmbTrack.filter((r) => r.categoria === categoria);
  }, [rutesAmbTrack, categoria]);

  return (
    <div>
      {/* Filtre de categoria, compartit entre mapa i llistat */}
      <div className="flex gap-2 overflow-x-auto mb-3 pb-1">
        <button
          onClick={() => setCategoria("totes")}
          className={`text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${
            categoria === "totes"
              ? "bg-terra text-white"
              : "bg-superficie border border-vora text-text-secundari"
          }`}
        >
          Totes
        </button>
        {categories.map(([value, label]) => (
          <button
            key={value}
            onClick={() => setCategoria(value)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${
              categoria === value
                ? "bg-terra text-white"
                : "bg-superficie border border-vora text-text-secundari"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <AllRoutesMap rutes={rutesAmbTrackFiltrades} />
      <RutesLlistat rutes={rutesFiltrades} />
    </div>
  );
}
