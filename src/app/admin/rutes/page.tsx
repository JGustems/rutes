import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

const ESTAT_COLORS: Record<string, string> = {
  esborrany: "bg-terra-clar text-terra-fosc",
  publicada: "bg-pi-clar text-pi-fosc",
  de_baixa: "bg-alerta-clar text-alerta",
};

const ESTAT_LABELS: Record<string, string> = {
  esborrany: "Esborrany",
  publicada: "Publicada",
  de_baixa: "De baixa",
};

const CATEGORIA_LABELS: Record<string, string> = {
  km_vertical: "Km vertical",
  trail_running: "Trail running",
  cross: "Cross",
  btt: "BTT",
  carretera: "Carretera",
};

export default async function AdminRutesPage() {
  const session = await auth();
  if (!session || (session.user as any).rol !== "administrador") {
    redirect("/");
  }

  const rutes = await sql`
    select
      r.id,
      r.nom,
      r.categoria,
      r.ubicacio,
      r.distancia_km,
      r.desnivell_positiu_m,
      r.bidireccional,
      r.estat,
      count(rc.id) as num_checkpoints
    from routes r
    left join route_checkpoints rc on rc.route_id = r.id
    group by r.id
    order by r.creat_el desc
  `;

  return (
    <main className="min-h-screen bg-fons p-6">
      <div className="max-w-4xl mx-auto">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-medium text-text-principal">Rutes</h1>
            <p className="text-sm text-text-secundari mt-1">
              {rutes.length} rutes al sistema
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin" className="text-sm text-text-secundari hover:text-text-principal transition-colors">
              ← Admin
            </Link>
            <Link href="/admin/rutes/nova" className="bg-terra text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-terra-fosc transition-colors">
              + Nova ruta
            </Link>
          </div>
        </div>

        {rutes.length === 0 ? (
          <div className="bg-superficie border border-vora rounded-card p-12 text-center">
            <p className="text-text-secundari mb-4">Encara no hi ha cap ruta creada.</p>
            <Link href="/admin/rutes/nova" className="bg-terra text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-terra-fosc transition-colors">
              Crea la primera ruta
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {rutes.map((r: any) => (
              <div key={r.id} className="bg-superficie border border-vora rounded-card px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-text-principal truncate">{r.nom}</p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${ESTAT_COLORS[r.estat]}`}>
                        {ESTAT_LABELS[r.estat]}
                      </span>
                    </div>
                    <p className="text-xs text-text-secundari">
                      {CATEGORIA_LABELS[r.categoria]}
                      {r.ubicacio ? ` · ${r.ubicacio}` : ""}
                      {r.distancia_km ? ` · ${r.distancia_km} km` : ""}
                      {r.desnivell_positiu_m ? ` · +${r.desnivell_positiu_m} m` : ""}
                      {r.bidireccional ? " · Bidireccional" : ""}
                      {` · ${r.num_checkpoints} checkpoints`}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Link href={`/admin/rutes/${r.id}/checkpoints`} className="text-xs text-cel font-medium hover:underline">
                      Checkpoints
                    </Link>
                    <Link href={`/admin/rutes/${r.id}/editar`} className="text-xs text-pi font-medium hover:underline">
                      Editar
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}
