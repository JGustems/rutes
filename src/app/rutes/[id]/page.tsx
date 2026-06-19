import { sql } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import RouteMap from "@/components/route-map-wrapper";

export const dynamic = "force-dynamic";

const CATEGORIA_LABELS: Record<string, string> = {
  km_vertical: "Km vertical",
  trail_running: "Trail running",
  cross: "Cross",
  btt: "BTT",
  carretera: "Carretera",
};

const DIFICULTAT_LABELS: Record<number, string> = {
  1: "Molt fàcil",
  2: "Fàcil",
  3: "Moderada",
  4: "Difícil",
  5: "Molt difícil",
};

export default async function RutaDetallPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const rutes = await sql`
    select * from routes where id = ${id} and estat = 'publicada' limit 1
  `;
  const ruta = rutes[0];
  if (!ruta) notFound();

  const numCheckpoints = await sql`
    select count(distinct checkpoint_id) as total
    from route_checkpoints
    where route_id = ${id} and sentit = 'anada'
  `;

  const trackRows = await sql`
    select geojson from route_tracks where route_id = ${id} limit 1
  `;
  const geojson = trackRows[0]?.geojson ?? null;

  const rankingTop = await sql`
    select nom_usuari, genere, temps_total, posicio
    from rankings
    where route_id = ${id}
    order by posicio asc
    limit 10
  `;

  return (
    <main className="min-h-screen bg-fons">
      <div className="max-w-2xl mx-auto px-4 py-6">

        <Link href="/" className="text-sm text-text-secundari hover:text-text-principal transition-colors mb-4 inline-block">
          ← Totes les rutes
        </Link>

        <h1 className="text-2xl font-medium text-text-principal mb-1">{ruta.nom}</h1>
        <p className="text-sm text-text-secundari mb-4">
          {CATEGORIA_LABELS[ruta.categoria] ?? ruta.categoria}
          {ruta.ubicacio ? ` · ${ruta.ubicacio}` : ""}
        </p>

        {ruta.descripcio && (
          <p className="text-sm text-text-principal mb-6 leading-relaxed">{ruta.descripcio}</p>
        )}

        {geojson && (
          <div className="mb-6">
            <RouteMap geojson={geojson} />
          </div>
        )}

        {ruta.wikiloc_url && (
          <a href={ruta.wikiloc_url} target="_blank" rel="noopener noreferrer" className="inline-block text-sm text-cel font-medium hover:underline mb-6">
            Veure track a Wikiloc →
          </a>
        )}

        <div className="grid grid-cols-2 gap-3 mb-6">
          {ruta.distancia_km && (
            <div className="bg-superficie border border-vora rounded-card p-4">
              <p className="text-xs text-text-secundari mb-1">Distància</p>
              <p className="text-lg font-medium text-text-principal">{ruta.distancia_km} km</p>
            </div>
          )}
          {ruta.desnivell_positiu_m && (
            <div className="bg-superficie border border-vora rounded-card p-4">
              <p className="text-xs text-text-secundari mb-1">Desnivell +</p>
              <p className="text-lg font-medium text-text-principal">{ruta.desnivell_positiu_m} m</p>
            </div>
          )}
          {ruta.dificultat && (
            <div className="bg-superficie border border-vora rounded-card p-4">
              <p className="text-xs text-text-secundari mb-1">Dificultat</p>
              <p className="text-lg font-medium text-text-principal">{DIFICULTAT_LABELS[ruta.dificultat] ?? ruta.dificultat}</p>
            </div>
          )}
          <div className="bg-superficie border border-vora rounded-card p-4">
            <p className="text-xs text-text-secundari mb-1">Punts de control</p>
            <p className="text-lg font-medium text-text-principal">{numCheckpoints[0].total}</p>
          </div>
        </div>

        {ruta.bidireccional && (
          <div className="bg-cel-clar text-cel-fosc text-xs font-medium px-3 py-2 rounded-lg mb-6 inline-block">
            Aquesta ruta es pot fer en els dos sentits
          </div>
        )}

        <h2 className="text-sm font-medium text-text-secundari uppercase tracking-wide mb-3">Rànquing</h2>
        {rankingTop.length === 0 ? (
          <p className="text-sm text-text-secundari italic mb-6">
            Encara no hi ha cap activitat completada en aquesta ruta.
          </p>
        ) : (
          <div className="bg-superficie border border-vora rounded-card overflow-hidden mb-6">
            {rankingTop.map((r: any, idx: number) => (
              <div key={idx} className={`flex items-center justify-between px-4 py-3 ${idx !== rankingTop.length - 1 ? "border-b border-vora" : ""}`}>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-text-secundari w-5">{r.posicio}</span>
                  <span className="text-sm text-text-principal">{r.nom_usuari}</span>
                </div>
                <span className="text-sm font-mono text-text-principal">{formatTemps(r.temps_total)}</span>
              </div>
            ))}
          </div>
        )}

        <Link href="/auth/login" className="w-full bg-terra text-white text-center rounded-lg py-3 text-sm font-medium hover:bg-terra-fosc transition-colors block">
          Inicia sessió per fer aquesta ruta
        </Link>

      </div>
    </main>
  );
}

function formatTemps(interval: any): string {
  if (typeof interval === "string") return interval;
  return String(interval);
}
