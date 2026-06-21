import { sql } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import RouteMap from "@/components/route-map-wrapper";
import ActivityRunner from "@/components/activity-runner";

export const dynamic = "force-dynamic";

export default async function ActivitatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user) {
    redirect(`/auth/login?callbackUrl=/rutes/${id}/activitat`);
  }

  const rutes = await sql`
    select * from routes where id = ${id} and estat = 'publicada' limit 1
  `;
  const ruta = rutes[0];
  if (!ruta) notFound();

  const trackRows = await sql`
    select geojson from route_tracks where route_id = ${id} limit 1
  `;
  const geojson = trackRows[0]?.geojson ?? null;
  const teTrack = trackRows.length > 0;

  const checkpointsPerActivitat = await sql`
    select c.id as checkpoint_id, c.nom, rc.ordre, rc.es_inici, rc.es_fi, t.codi as tag_codi, t.tipus as tag_tipus
    from route_checkpoints rc
    join checkpoints c on c.id = rc.checkpoint_id
    left join tags t on t.id = c.tag_id
    where rc.route_id = ${id} and rc.sentit = 'anada'
    order by rc.ordre asc
  `;

  const configRows = await sql`
    select valor from app_config where clau = 'llindar_reports_tag' limit 1
  `;
  const llindarReports = configRows[0] ? parseInt(configRows[0].valor) : 999999;

  const reportsRows = await sql`
    select checkpoint_id, count(*) as total
    from tag_reports
    where estat = 'pendent' and checkpoint_id in (
      select checkpoint_id from route_checkpoints where route_id = ${id}
    )
    group by checkpoint_id
  `;
  const reportsPerCheckpoint = new Map(
    reportsRows.map((r: any) => [r.checkpoint_id, parseInt(r.total)])
  );

  return (
    <main className="min-h-screen bg-fons">
      <div className="max-w-2xl mx-auto px-4 py-6">

        <div className="flex items-center justify-between mb-4">
          <Link
            href={`/rutes/${id}`}
            className="text-sm text-text-secundari hover:text-text-principal transition-colors"
          >
            ← {ruta.nom}
          </Link>
        </div>

        {geojson && (
          <div className="mb-3">
            <RouteMap geojson={geojson} />
          </div>
        )}

        {teTrack && (
          <div className="flex gap-2 mb-6">
            <a
              href={`/api/rutes/${id}/descarregar?format=gpx`}
              className="text-xs text-pi font-medium border border-pi rounded-lg px-3 py-1.5 hover:bg-pi-clar transition-colors"
            >
              Descarregar GPX
            </a>
            <a
              href={`/api/rutes/${id}/descarregar?format=kml`}
              className="text-xs text-pi font-medium border border-pi rounded-lg px-3 py-1.5 hover:bg-pi-clar transition-colors"
            >
              Descarregar KML
            </a>
          </div>
        )}

        <ActivityRunner
          routeId={id}
          routeNom={ruta.nom}
          llindarReports={llindarReports}
          checkpoints={checkpointsPerActivitat.map((c: any) => ({
            checkpointId: c.checkpoint_id,
            nom: c.nom,
            ordre: c.ordre,
            esInici: c.es_inici,
            esFi: c.es_fi,
            tagCodi: c.tag_codi,
            tagTipus: c.tag_tipus,
            numReportsPendents: reportsPerCheckpoint.get(c.checkpoint_id) ?? 0,
          }))}
        />

      </div>
    </main>
  );
}
