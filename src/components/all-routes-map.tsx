"use client";

import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
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

// Tolerancia per considerar dos punts "el mateix lloc" (en graus,
// aprox. 30-40 metres)
const TOLERANCIA = 0.0004;

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

function iconaGrup(numRutes: number, seleccionat: boolean) {
  const mida = numRutes > 1 ? 26 : 14;
  const color = seleccionat ? "#B5533C" : "#C97D4A";
  const contingut =
    numRutes > 1
      ? `<div style="width:${mida}px;height:${mida}px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;color:white;font-size:12px;font-weight:600;">${numRutes}</div>`
      : `<div style="width:${mida}px;height:${mida}px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4);"></div>`;

  return L.divIcon({
    className: "",
    html: contingut,
    iconSize: [mida, mida],
    iconAnchor: [mida / 2, mida / 2],
  });
}

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
  const centerDefecte: [number, number] = [41.5912, 1.5209];
  const [rutaSeleccionada, setRutaSeleccionada] = useState<string | null>(null);

  // Agrupar rutes pel seu punt de sortida (amb tolerancia)
  const grups = useMemo(() => {
    const llistaGrups: { punt: [number, number]; rutes: RutaAmbTrack[] }[] = [];

    for (const r of rutes) {
      const punt = obtenirPrimerPunt(r.geojson);
      if (!punt) continue;

      const grupExistent = llistaGrups.find(
        (g) =>
          Math.abs(g.punt[0] - punt[0]) < TOLERANCIA &&
          Math.abs(g.punt[1] - punt[1]) < TOLERANCIA
      );

      if (grupExistent) {
        grupExistent.rutes.push(r);
      } else {
        llistaGrups.push({ punt, rutes: [r] });
      }
    }

    return llistaGrups;
  }, [rutes]);

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
                color:
                  rutaSeleccionada === r.id
                    ? "#B5533C"
                    : COLOR_PER_CATEGORIA[r.categoria] ?? "#C97D4A",
                weight: rutaSeleccionada === r.id ? 5 : 3,
                opacity: rutaSeleccionada && rutaSeleccionada !== r.id ? 0.3 : 0.8,
              }}
              eventHandlers={{
                click: () => setRutaSeleccionada(r.id),
              }}
            />
          ) : null
        )}

        {grups.map((grup, idx) => {
          const numRutes = grup.rutes.length;
          const teSeleccionada = grup.rutes.some((r) => r.id === rutaSeleccionada);

          return (
            <Marker
              key={`grup-${idx}`}
              position={grup.punt}
              icon={iconaGrup(numRutes, teSeleccionada)}
            >
              <Popup minWidth={180}>
                {numRutes === 1 ? (
                  <div className="flex flex-col gap-2">
                    <p className="text-sm font-medium">{grup.rutes[0].nom}</p>
                    <a
                      href={`/rutes/${grup.rutes[0].id}`}
                      className="text-xs text-pi font-medium underline"
                    >
                      Anar a la ruta →
                    </a>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs text-text-secundari mb-1">
                      {numRutes} rutes surten d&apos;aquí
                    </p>
                    {grup.rutes.map((r) => (
                      <div key={r.id} className="flex items-center justify-between gap-2">
                        <button
                          onClick={() => setRutaSeleccionada(r.id)}
                          className={`text-xs text-left flex-1 ${
                            rutaSeleccionada === r.id
                              ? "text-alerta font-medium"
                              : "text-text-principal"
                          }`}
                        >
                          {r.nom}
                        </button>
                        {rutaSeleccionada === r.id && (
                          <a
                            href={`/rutes/${r.id}`}
                            className="text-xs text-pi font-medium underline shrink-0"
                          >
                            Anar →
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Popup>
            </Marker>
          );
        })}

        <AjustarVistaGlobal rutes={rutes} />
      </MapContainer>
    </div>
  );
}
