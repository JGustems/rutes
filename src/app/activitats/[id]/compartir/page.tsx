import { sql } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CompartirActivitatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const resultats = await sql`
    select
      ar.activity_id,
      ar.estat,
      ar.temps_total,
      r.id as route_id,
      r.nom as ruta_nom,
      r.categoria,
      r.ubicacio,
      coalesce(u.alies, u.nom) as nom_usuari,
      rk.posicio,
      (
        select count(*) from rankings rk2 where rk2.route_id = r.id and rk2.sentit = ar.sentit
      ) as total_participants
    from activity_results ar
    join routes r on r.id = ar.route_id
    join users u on u.id = ar.user_id
    left join rankings rk on rk.activity_id = ar.activity_id
    where ar.activity_id = ${id} and ar.estat = 'completada'
    limit 1
  `;

  const resultat = resultats[0];
  if (!resultat) notFound();

  const CATEGORIA_LABELS: Record<string, string> = {
    km_vertical: "Km vertical",
    trail_running: "Trail running",
    cross: "Cross",
    btt: "BTT",
    carretera: "Carretera",
  };

  return (
    <main className="min-h-screen bg-fons flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        <div className="bg-superficie border border-vora rounded-card overflow-hidden">
          <div className="bg-pi px-6 py-8 text-center">
            <p className="text-xs text-white/80 uppercase tracking-wide mb-1">
              {CATEGORIA_LABELS[resultat.categoria] ?? resultat.categoria}
            </p>
            <h1 className="text-xl font-semibold text-white">
              {resultat.ruta_nom}
            </h1>
            {resultat.ubicacio && (
              <p className="text-sm text-white/80 mt-1">{resultat.ubicacio}</p>
            )}
          </div>

          <div className="p-6 text-center">
            <p className="text-xs text-text-secundari uppercase tracking-wide mb-1">
              Temps de {resultat.nom_usuari}
            </p>
            <p className="text-3xl font-semibold text-text-principal font-mono mb-4">
              {formatTemps(resultat.temps_total)}
            </p>

            {resultat.posicio && (
              <div className="inline-block bg-terra-clar text-terra-fosc text-sm font-medium px-4 py-2 rounded-lg mb-4">
                Posició #{resultat.posicio}
                {resultat.total_participants ? ` de ${resultat.total_participants}` : ""}
              </div>
            )}

            <p className="text-xs text-text-secundari mb-6">
              Fet amb Fita — cronometra&apos;t a tu mateix en rutes de muntanya
            </p>

            <Link
              href={`/rutes/${resultat.route_id}`}
              className="w-full bg-terra text-white text-center rounded-lg py-3 text-sm font-medium hover:bg-terra-fosc transition-colors block"
            >
              Veure aquesta ruta
            </Link>
          </div>
        </div>

      </div>
    </main>
  );
}

function formatTemps(interval: any): string {
  if (!interval) return "";
  if (typeof interval === "string") return interval;

  const h = interval.hours ?? 0;
  const m = interval.minutes ?? 0;
  const s = Math.round(interval.seconds ?? 0);
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}
