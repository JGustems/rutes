"use client";

import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function RouteMap({ geojson }: { geojson: any }) {
  let center: [number, number] = [41.5912, 1.5209]; // Catalunya, per defecte

  try {
    const coords = geojson.features?.[0]?.geometry?.coordinates;
    if (coords && coords.length > 0) {
      const punt = Array.isArray(coords[0][0]) ? coords[0][0] : coords[0];
      center = [punt[1], punt[0]]; // GeoJSON es [lon, lat], Leaflet vol [lat, lon]
    }
  } catch {
    // Si falla, ens quedem amb el centre per defecte
  }

  return (
    <div className="w-full h-64 rounded-card overflow-hidden border border-vora">
      <MapContainer
        center={center}
        zoom={13}
        style={{ width: "100%", height: "100%" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <GeoJSON data={geojson} style={{ color: "#C97D4A", weight: 4 }} />
      </MapContainer>
    </div>
  );
}
