"use client";

import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
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

const TOLERANCIA_GRUP_METRES = 200;
const TOLERANCIA_CLIC_METRES = 20;

function distanciaMetres(a: [number, number], b: [number, number]): number {
  const R = 6371000;
  const lat1 = (a[0] * Math.PI) / 180;
  const lat2 = (b[0] * Math.PI) / 180;
  const deltaLat = ((b[0] - a[0]) * Math.PI) / 180;
  const deltaLon = ((b[1] - a[1]) * Math.PI) / 180;

  const sinLat = Math.sin(deltaLat / 2);
  const sinLon = Math.sin(deltaLon / 2);
  const x = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLon * sinLon;
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));

  return R * c;
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

function extreureTotsPunts(geojson: any): [number, number][] {
  const punts: [number, number][] = [];
  function processar(geom: any) {
    if (!geom) return;
    if (geom.type === "LineString") {
      for (const c of geom.coordinates) punts.push([c[1], c[0]]);
    } else if (geom.type === "MultiLineString") {
      for (const linia of geom.coordinates) {
        for (const c of linia) punts.push([c[1], c[0]]);
      }
    }
  }
  if (geojson?.type === "FeatureCollection") {
    for (const f of geojson.features) processar(f.geometry);
  } else if (geojson?.type === "Feature") {
    processar(geojson.geometry);
  } else {
    processar(geojson);
  }
  return punts;
}

function trackPassaPerPunt(geojson: any, punt: [number, number]): boolean {
  const punts = extreureTotsPunts(geojson);
  return punts.some((p) => distanciaMetres(p, punt) < TOLERANCIA_CLIC_METRES);
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

function DesseleccionarEnClicarFora({ onClickMapa }: { onClickMapa: () => void }) {
  useMapEvents({
    click: () => {
      onClickMapa();
    },
  });
  return null;
}

export default function AllRoutesMap({ rutes }: { rutes: RutaAmbTrack[] }) {
  const centerDefecte: [number, number] = [41.5912, 1.5209];
  const [rutaSeleccionada, setRutaSeleccionada] = useState<string | null>(null);
  const [puntSeleccio, setPuntSeleccio] = useState<[number, number] | null>(null);
  const [opcionsClic, setOpcionsClic] = useState<{
    posicio: [number, number];
    rutes: RutaAmbTrack[];
  } | null>(null);

  const grups = useMemo(() => {
    const llistaGrups: { punt: [number, number]; rutes: RutaAmbTrack[] }[] = [];

    for (const r of rutes) {
      const punt = obtenirPrimerPunt(r.geojson);
      if (!punt) continue;

      const grupExistent = llistaGrups.find(
        (g) => distanciaMetres(g.punt, punt) < TOLERANCIA_GRUP_METRES
      );

      if (grupExistent) {
        grupExistent.rutes.push(r);
      } else {
        llistaGrups.push({ punt, rutes: [r] });
      }
    }

    return llistaGrups;
  }, [rutes]);

  const rutaSeleccionadaObj = rutes.find((r) => r.id === rutaSeleccionada) ?? null;

  function handleClickTrack(puntClic: [number, number]) {
    const coincidents = rutes.filter(
      (r) => r.geojson && trackPassaPerPunt(r.geojson, puntClic)
    );

    if (coincidents.length <= 1) {
      setRutaSeleccionada(coincidents[0]?.id ?? null);
      setPuntSeleccio(coincidents[0] ? puntClic : null);
      setOpcionsClic(null);
    } else {
      setOpcionsClic({ posicio: puntClic, rutes: coincidents });
    }
  }

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

        {/* Capa invisible mes gruixuda nomes per ampliar la zona
            clicable de cada track, sense canviar-ne l'aspecte visual */}
        {rutes.map((r) =>
          r.geojson ? (
            <GeoJSON
              key={`hitbox-${r.id}`}
              data={r.geojson}
              style={{ color: "#000", weight: 18, opacity: 0 }}
              eventHandlers={{
                click: (e: any) => {
                  L.DomEvent.stopPropagation(e);
                  const punt: [number, number] = [e.latlng.lat, e.latlng.lng];
                  handleClickTrack(punt);
                },
              }}
            />
          ) : null
        )}

        {/* Capa visible, nomes pintura, sense interaccio propia */}
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
                opacity: rutaSeleccionada && rutaSeleccionada !== r.id ? 0.55 : 0.85,
              }}
              interactive={false}
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
              <Popup minWidth={180} className="popup-translucid">
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

        {/* Popup que apareix en seleccionar un track clicant-hi
            directament (no des d'un marcador de grup) */}
        {rutaSeleccionadaObj && puntSeleccio && (
          <Popup
            position={puntSeleccio}
            eventHandlers={{
              remove: () => {
                setRutaSeleccionada(null);
                setPuntSeleccio(null);
              },
            }}
            className="popup-translucid"
          >
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">{rutaSeleccionadaObj.nom}</p>
              <a
                href={`/rutes/${rutaSeleccionadaObj.id}`}
                className="text-xs text-pi font-medium underline"
              >
                Anar a la ruta →
              </a>
            </div>
          </Popup>
        )}

        {opcionsClic && (
          <Popup
            position={opcionsClic.posicio}
            eventHandlers={{ remove: () => setOpcionsClic(null) }}
            className="popup-translucid"
          >
            <div className="flex flex-col gap-2">
              <p className="text-xs text-text-secundari mb-1">
                Per aquí passen {opcionsClic.rutes.length} rutes. Quina vols veure?
              </p>
              {opcionsClic.rutes.map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    setRutaSeleccionada(r.id);
                    setPuntSeleccio(opcionsClic.posicio);
                    setOpcionsClic(null);
                  }}
                  className="text-xs text-left text-pi font-medium hover:underline"
                >
                  {r.nom}
                </button>
              ))}
            </div>
          </Popup>
        )}

        <AjustarVistaGlobal rutes={rutes} />
        <DesseleccionarEnClicarFora
          onClickMapa={() => {
            setRutaSeleccionada(null);
            setPuntSeleccio(null);
            setOpcionsClic(null);
          }}
        />
      </MapContainer>

      <style jsx global>{`
        .popup-translucid .leaflet-popup-content-wrapper {
          background: rgba(255, 255, 255, 0.72);
          backdrop-filter: blur(2px);
        }
        .popup-translucid .leaflet-popup-tip {
          background: rgba(255, 255, 255, 0.95);
        }
      `}</style>
    </div>
  );
}
