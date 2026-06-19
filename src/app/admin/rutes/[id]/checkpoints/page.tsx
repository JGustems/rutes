import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { sql } from "@/lib/db";
import Link from "next/link";
import CheckpointForm from "./checkpoint-form";
import CheckpointItem from "./checkpoint-item";

export const dynamic = "force-dynamic";

export default async function CheckpointsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session || (session.user as any).rol !== "administrador") {
    redirect("/");
  }

  const { id } = await params;

  const rutes = await sql`select * from routes where id = ${id} limit 1`;
  const ruta = rutes[0];
  if (!ruta) notFound();

  const checkpointsAnada = await sql`
    select rc.id as rc_id, rc.ordre, rc.es_inici, rc.es_fi, c.id, c.nom, c.latitud, c.longitud, c.tag_id
    from route_checkpoints rc
    join checkpoints c on c.id = rc.checkpoint_id
    where rc.route_id = ${id} and rc.sentit = 'anada'
    order by rc.ordre asc
  `;

  const checkpointsTornada = ruta.bidireccional
    ? await sql`
        select rc.id as rc_id, rc.ordre, rc.es_inici, rc.es_fi, c.id, c.nom, c.latitud, c.longitud, c.tag_id
        from route_checkpoints rc
        join checkpoints c on c.id = rc.checkpoint_id
        where rc.route_id = ${id} and rc.sentit = 'tornada'
        order by rc.ordre asc
      `
    : [];

  // Tags actius que encara no estan assignats a cap checkpoint
  const tagsDisponiblesRaw = await sql`
    select id, codi, tipus
    from tags
    where estat = 'actiu' and id not in (
      select tag_id from checkpoints where tag_id is not null
    )
    order by tipus asc, codi asc
  `;
  const tagsDisponibles = tagsDisponiblesRaw as { id: string; codi: string; tipus: string }[];

  return (
    <main className="min-h-screen bg-fons p-6">
      <div className="max-w-2xl mx-auto">

        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-medium text-text-principal">{ruta.nom}</h1>
          <Link href="/admin/rutes" className="text-sm text-text-secundari hover:text-text-principal transition-colors">
            ← Rutes
          </Link>
        </div>
        <p className="text-sm text-text-secundari mb-8">
          Punts de control {ruta.bidireccional ? "· Ruta bidireccional" : ""}
        </p>

        <h2 className="text-sm font-medium text-text-secundari uppercase tracking-wide mb-3">
          {ruta.bidireccional ? "Sentit anada" : "Punts de control"}
        </h2>
        <div className="flex flex-col gap-2 mb-6">
          {checkpointsAnada.length === 0 && (
            <p className="text-sm text-text-secundari italic">Encara no hi ha cap checkpoint.</p>
          )}
          {checkpointsAnada.map((cp: any) => (
            <CheckpointItem key={cp.rc_id} checkpoint={cp} colorBadge="bg-pi-clar text-pi-fosc" tagsDisponibles={tagsDisponibles} />
          ))}
        </div>

        {ruta.bidireccional && (
          <>
            <h2 className="text-sm font-medium text-text-secundari uppercase tracking-wide mb-3">
              Sentit tornada
            </h2>
            <div className="flex flex-col gap-2 mb-6">
              {checkpointsTornada.length === 0 && (
                <p className="text-sm text-text-secundari italic">Encara no hi ha cap checkpoint per aquest sentit.</p>
              )}
              {checkpointsTornada.map((cp: any) => (
                <CheckpointItem key={cp.rc_id} checkpoint={cp} colorBadge="bg-cel-clar text-cel-fosc" tagsDisponibles={tagsDisponibles} />
              ))}
            </div>
          </>
        )}

        <CheckpointForm routeId={id} bidireccional={ruta.bidireccional} />

      </div>
    </main>
  );
}
