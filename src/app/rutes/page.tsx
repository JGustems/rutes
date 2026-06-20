import { sql } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

const CATEGORIA_LABELS: Record<string, string> = {
  km_vertical: "Km vertical",
  trail_running: "Trail running",
  cross: "Cross",
  btt: "BTT",
  carretera: "Carretera",
};

const CATEGORIA_COLORS: Record<string, string> = {
  km_vertical: "bg-pi",
  trail_running: "bg-cel",
  cross: "bg-terra",
  btt: "bg-pi",
  carretera: "bg-cel",
};

export default async function RutesPage() {
  const rutes = await sql`
    select
      r.id, r.nom, r.categoria, r.ubicacio, r.distancia_km,
      r.desnivell_positiu_m, r.bidireccional,
      count(distinct rc.checkpoint_id) as num_checkpoints
    from routes r
    left join route_checkpoints rc on rc.route_id = r.id
    where r.estat = 'publicada'
    group by r.id
    order by r.creat_el desc
  `;

  return (
    <main className="min-h-screen bg-fons">
      <div className="max-w-2xl mx-auto px-4 py-6">

        <h1 className="text-xl font-medium text-text-principal mb-6">
          Totes les rutes
        </h1>

        {rutes.length === 0 ? (
          <div className="bg-superficie border border-vora rounded-card p-12 text-center">
            <p className="text-text-secundari">Encara no hi ha cap ruta publicada.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {rutes.map((r: any) => (
              <Link key={r.id} href={`/rutes/${r.id}`} className="bg-superficie border border-vora rounded-card overflow-hidden hover:shadow-sm transition-shadow block">
                <div className={`h-20 ${CATEGORIA_COLORS[r.categoria] ?? "bg-pi"} flex items-end p-3`}>
                  <span className="bg-white/90 text-text-principal text-xs font-medium px-2.5 py-1 rounded-lg">
                    {CATEGORIA_LABELS[r.categoria] ?? r.categoria}
                  </span>
                </div>
                <div className="p-4">
                  <p className="text-base font-medium text-text-principal mb-1">{r.nom}</p>
                  <p className="text-xs text-text-secundari mb-3">
                    {r.ubicacio ? `${r.ubicacio} · ` : ""}
                    {r.distancia_km ? `${r.distancia_km} km · ` : ""}
                    {r.desnivell_positiu_m ? `+${r.desnivell_positiu_m} m · ` : ""}
                    {r.num_checkpoints} punts de control
                  </p>
                  <div className="flex gap-2">
                    {r.bidireccional && (
                      <span className="bg-fons text-text-secundari text-xs px-2 py-1 rounded-lg">Bidireccional</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}
