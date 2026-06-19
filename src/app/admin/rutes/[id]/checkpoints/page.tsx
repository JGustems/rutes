import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { sql } from "@/lib/db";
import Link from "next/link";
import CheckpointForm from "./checkpoint-form";

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
            <div key={cp.rc_id} className="bg-superficie border border-vora rounded-card px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium bg-pi-clar text-pi-fosc rounded-full w-6 h-6 flex items-center justify-center shrink-0">
                  {cp.ordre}
                </span>
                <div>
                  <p className="text-sm text-text-principal">
                    {cp.nom}
                    {cp.es_inici && <span className="text-xs text-pi ml-2">(Inici)</span>}
                    {cp.es_fi && <span className="text-xs text-terra ml-2">(Fi)</span>}
                  </p>
                  <p className="text-xs text-text-secundari">
                    {cp.latitud.toFixed(5)}, {cp.longitud.toFixed(5)}
                    {cp.tag_id ? " · Tag assignat" : " · Sense tag"}
                  </p>
                </div>
              </div>
            </div>
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
                <div key={cp.rc_id} className="bg-superficie border border-vora rounded-card px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium bg-cel-clar text-cel-fosc rounded-full w-6 h-6 flex items-center justify-center shrink-0">
                      {cp.ordre}
                    </span>
                    <div>
                      <p className="text-sm text-text-principal">
                        {cp.nom}
                        {cp.es_inici && <span className="text-xs text-pi ml-2">(Inici)</span>}
                        {cp.es_fi && <span className="text-xs text-terra ml-2">(Fi)</span>}
                      </p>
                      <p className="text-xs text-text-secundari">
                        {cp.latitud.toFixed(5)}, {cp.longitud.toFixed(5)}
                        {cp.tag_id ? " · Tag assignat" : " · Sense tag"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <CheckpointForm routeId={id} bidireccional={ruta.bidireccional} />

      </div>
    </main>
  );
}
