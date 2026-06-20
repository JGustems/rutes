"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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

export default function RouteMap({ geojson }: { geojson: any }) {
  const centerDefecte: [number, number] = [41.5912, 1.5209];

  return (
    <div className="w-full h-64 rounded-card overflow-hidden border border-vora">
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
        <GeoJSON data={geojson} style={{ color: "#C97D4A", weight: 4 }} />
        <AjustarVista geojson={geojson} />
      </MapContainer>
    </div>
  );
}
