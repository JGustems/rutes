"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { useRouter } from "next/navigation";
import "leaflet/dist/leaflet.css";

type RutaAmbTrack = {
  id: string;
  nom: string;
  categoria: string;
  geojson: any | null;
};

const COLOR_PER_CATEGORIA: Record<string, string> = {
  km_vertical: "#4A7C59",
  trail_running: "#5B8AA6",
  cross: "#C97D4A",
  btt: "#2F5238",
  carretera: "#0F4D66",
};

// Icona personalitzada per als marcadors (la per defecte de Leaflet
// no es carrega be amb bundlers moderns sense configuracio extra)
const iconaMarcador = L.divIcon({
  className: "",
  html: `<div style="width:14px;height:14px;border-radius:50%;background:#C97D4A;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4);"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

function AjustarVistaGlobal({ rutes }: { rutes: RutaAmbTrack[] }) {
  const map = useMap();

  useEffect(() => {
    try {
      const totsBounds: L.LatLngBounds[] = [];
      for (const r of rutes) {
        if (r.geojson) {
          const layer = L.geoJSON(r.geojson);
          const b = layer.getBounds();
          if (b.isValid()) totsBounds.push(b);
        }
      }
      if (totsBounds.length === 0) return;

      let bounds = totsBounds[0];
      for (const b of totsBounds.slice(1)) {
        bounds = bounds.extend(b);
      }
      map.fitBounds(bounds, { padding: [30, 30] });
    } catch {
      // Si falla, deixem la vista per defecte
    }
  }, [rutes, map]);

  return null;
}

export default function AllRoutesMap({ rutes }: { rutes: RutaAmbTrack[] }) {
  const router = useRouter();
  const centerDefecte: [number, number] = [41.5912, 1.5209];

  return (
    <div className="w-full h-72 rounded-card overflow-hidden border border-vora mb-6">
      <MapContainer
        center={centerDefecte}
        zoom={9}
        style={{ width: "100%", height: "100%" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {rutes.map((r) =>
          r.geojson ? (
            <GeoJSON
              key={r.id}
              data={r.geojson}
              style={{
                color: COLOR_PER_CATEGORIA[r.categoria] ?? "#C97D4A",
                weight: 3,
                opacity: 0.8,
              }}
              eventHandlers={{
                click: () => router.push(`/rutes/${r.id}`),
              }}
            />
          ) : null
        )}

        {rutes.map((r) => {
          const primerPunt = obtenirPrimerPunt(r.geojson);
          if (!primerPunt) return null;
          return (
            <Marker key={`marker-${r.id}`} position={primerPunt} icon={iconaMarcador}>
              <Popup>
                <a href={`/rutes/${r.id}`} className="text-sm font-medium">
                  {r.nom}
                </a>
              </Popup>
            </Marker>
          );
        })}

        <AjustarVistaGlobal rutes={rutes} />
      </MapContainer>
    </div>
  );
}

function obtenirPrimerPunt(geojson: any): [number, number] | null {
  if (!geojson) return null;
  try {
    const coords =
      geojson.features?.[0]?.geometry?.coordinates ?? geojson.geometry?.coordinates;
    if (!coords) return null;
    const punt = Array.isArray(coords[0][0]) ? coords[0][0] : coords[0];
    return [punt[1], punt[0]];
  } catch {
    return null;
  }
}
