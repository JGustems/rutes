"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Component intern que ajusta el mapa per mostrar tot el track
// un cop aquest es carrega (fa servir useMap, nomes funciona
// dins d'un MapContainer).
function AjustarVista({ geojson }: { geojson: any }) {
  const map = useMap();

  useEffect(() => {
    try {
      const layer = L.geoJSON(geojson);
      const bounds = layer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    } catch {
      // Si el geojson no es valid per calcular bounds, deixem
      // el mapa amb la vista per defecte
    }
  }, [geojson, map]);

  return null;
}

// Component intern que forca Leaflet a recalcular la mida del
// mapa quan entrem/sortim de pantalla completa (sino el mapa
// es queda amb la mida antiga fins que es mou manualment)
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

export default function RouteMap({ geojson }: { geojson: any }) {
  const centerDefecte: [number, number] = [41.5912, 1.5209]; // Catalunya
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

  return (
    <div
      ref={contenidorRef}
      className={`relative w-full overflow-hidden border border-vora ${
        esFullscreen ? "h-screen" : "h-64 rounded-card"
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
        <GeoJSON data={geojson} style={{ color: "#C97D4A", weight: 4 }} />
        <AjustarVista geojson={geojson} />
        <RecalcularMidaEnFullscreen esFullscreen={esFullscreen} />
      </MapContainer>
    </div>
  );
}
