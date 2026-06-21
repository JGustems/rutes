"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  const distancies = punts.map((p) => distanciaMetres(p, punt));
  const minDist = Math.min(...distancies);
  return minDist < TOLERANCIA_CLIC_METRES;
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

function RecalcularMidaEnFullscreen({ esFullscreen }: { esFullscreen: boolean }) {
  const map = useMap();

  useEffect(() => {
    const timeout = setTimeout(() => {
      map.invalidateSize();
    }, 150);
    return () => clearTimeout(timeout);
  }, [esFullscreen, map]);

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
  const contenidorRef = useRef<HTMLDivElement>(null);
  const [esFullscreen, setEsFullscreen] = useState(false);

  useEffect(() => {
    function handleFullscreenChange() {
      setEsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  async function alternarFullscreen() {
    if (!contenidorRef.current) return;
    if (!document.fullscreenElement) {
      await contenidorRef.current.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  }

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
    <div
      ref={contenidorRef}
      className={`relative w-full overflow-hidden border border-vora mb-6 ${
        esFullscreen ? "h-screen" : "h-72 rounded-card"
      }`}
    >
      <button
        onClick={alternarFullscreen}
        aria-label={esFullscreen ? "Sortir de pantalla completa" : "Pantalla completa"}
        className="absolute top-2 right-2 z-[1000] bg-white/90 hover:bg-white text-text-principal rounded-lg p-2 shadow-md transition-colors"
      >
        {esFullscreen ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 9L4 4M9 9H5M9 9V5M15 9L20 4M15 9H19M15 9V5M9 15L4 20M9 15H5M9 15V19M15 15L20 20M15 15H19M15 15V19" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
          </svg>
        )}
      </button>

      <MapContainer
        center={centerDefecte}
        zoom={9}
        style={{ width: "100%", height: "100%" }}
        scrollWheelZoom={esFullscreen}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

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

        {/* Capa invisible mes gruixuda PER SOBRE, nomes per ampliar
            la zona clicable de cada track. */}
        {rutes.map((r) =>
          r.geojson ? (
            <GeoJSON
              key={`hitbox-${r.id}`}
              data={r.geojson}
              style={{ color: "#000", weight: 24, opacity: 0 }}
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
        <RecalcularMidaEnFullscreen esFullscreen={esFullscreen} />
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
          background: rgba(255, 255, 255, 0.88);
          backdrop-filter: blur(2px);
        }
        .popup-translucid .leaflet-popup-tip {
          background: rgba(255, 255, 255, 0.88);
        }
      `}</style>
    </div>
  );
}
