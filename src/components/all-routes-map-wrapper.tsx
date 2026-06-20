"use client";

import dynamic from "next/dynamic";

const AllRoutesMapInner = dynamic(() => import("./all-routes-map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-72 rounded-card bg-fons border border-vora flex items-center justify-center mb-6">
      <p className="text-sm text-text-secundari">Carregant mapa...</p>
    </div>
  ),
});

export default function AllRoutesMapWrapper({ rutes }: { rutes: any[] }) {
  return <AllRoutesMapInner rutes={rutes} />;
}
