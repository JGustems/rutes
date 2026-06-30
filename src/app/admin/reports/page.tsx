import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import Link from "next/link";
import ReportItem from "./report-item";
import LlindarForm from "./llindar-form";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const session = await auth();
  if (!session || (session.user as any).rol !== "administrador") {
    redirect("/");
  }

  const reportsPendents = await sql`
    select
      tr.id, tr.motiu, tr.creat_el,
      c.nom as checkpoint_nom,
      r.nom as ruta_nom, r.id as ruta_id,
      u.nom as usuari_nom
    from tag_reports tr
    join checkpoints c on c.id = tr.checkpoint_id
    left join route_checkpoints rc on rc.checkpoint_id = c.id
    left join routes r on r.id = rc.route_id
    left join users u on u.id = tr.user_id
    where tr.estat = 'pendent'
    order by tr.creat_el desc
  `;

  const reportsResolts = await sql`
    select
      tr.id, tr.motiu, tr.creat_el, tr.resolt_el,
      c.nom as checkpoint_nom,
      r.nom as ruta_nom, r.id as ruta_id,
      u.nom as usuari_nom
    from tag_reports tr
    join checkpoints c on c.id = tr.checkpoint_id
    left join route_checkpoints rc on rc.checkpoint_id = c.id
    left join routes r on r.id = rc.route_id
    left join users u on u.id = tr.user_id
    where tr.estat = 'resolt'
    order by tr.resolt_el desc
    limit 20
  `;

  const configRows = await sql`
    select valor from app_config where clau = 'llindar_reports_tag' limit 1
  `;
  const llindarActual = configRows[0] ? parseInt(configRows[0].valor) : 999999;

  return (
    <main className="min-h-screen bg-fons p-6">
      <div className="max-w-2xl mx-auto">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-medium text-text-principal">
              Avisos de tags
            </h1>
            <p className="text-sm text-text-secundari mt-1">
              {reportsPendents.length} pendents
            </p>
          </div>
          <Link href="/admin" className="text-sm text-text-secundari hover:text-text-principal transition-colors">
            ← Admin
          </Link>
        </div>

        <LlindarForm llindarActual={llindarActual} />

        <h2 className="text-sm font-medium text-text-secundari uppercase tracking-wide mb-3">
          Pendents
        </h2>
        <div className="flex flex-col gap-2 mb-8">
          {reportsPendents.length === 0 && (
            <p className="text-sm text-text-secundari italic">
              No hi ha cap avís pendent.
            </p>
          )}
          {reportsPendents.map((r: any) => (
            <ReportItem key={r.id} report={r} />
          ))}
        </div>

        {reportsResolts.length > 0 && (
          <>
            <h2 className="text-sm font-medium text-text-secundari uppercase tracking-wide mb-3">
              Resolts recentment
            </h2>
            <div className="flex flex-col gap-2">
              {reportsResolts.map((r: any) => (
                <div
                  key={r.id}
                  className="bg-superficie border border-vora rounded-card px-4 py-3 opacity-60"
                >
                  <p className="text-sm text-text-principal">
                    {r.checkpoint_nom}
                    {r.ruta_nom && <span className="text-text-secundari"> · {r.ruta_nom}</span>}
                  </p>
                  {r.motiu && <p className="text-xs text-text-secundari mt-1">{r.motiu}</p>}
                </div>
              ))}
            </div>
          </>
        )}

      </div>
    </main>
  );
}
