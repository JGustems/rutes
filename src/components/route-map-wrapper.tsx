"use client";

import dynamic from "next/dynamic";

const RouteMapInner = dynamic(() => import("./route-map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 rounded-card bg-fons border border-vora flex items-center justify-center">
      <p className="text-sm text-text-secundari">Carregant mapa...</p>
    </div>
  ),
});

export default function RouteMapWrapper({ geojson }: { geojson: any }) {
  return <RouteMapInner geojson={geojson} />;
}
