import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

const ESTAT_COLORS: Record<string, string> = {
  completada: "bg-exit-clar text-exit-fosc",
  invalidada: "bg-alerta-clar text-alerta",
  en_curs: "bg-terra-clar text-terra-fosc",
};

const ESTAT_LABELS: Record<string, string> = {
  completada: "Completada",
  invalidada: "Invalidada",
  en_curs: "En curs",
};

function formatTemps(interval: any): string {
  if (!interval) return "";
  if (typeof interval === "string") return interval;

  // Neon/postgres pot retornar l'interval com objecte { hours, minutes, seconds }
  const h = interval.hours ?? 0;
  const m = interval.minutes ?? 0;
  const s = Math.round(interval.seconds ?? 0);
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

export default async function HistorialPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/login");
  }

  const userId = (session.user as any).id;

  const activitats = await sql`
    select
      a.id, a.estat, a.sentit, a.iniciada_el, a.finalitzada_el,
      r.nom as ruta_nom, r.id as ruta_id,
      (a.finalitzada_el - a.iniciada_el) as temps_total,
      count(cp.id) as controls_validats,
      (
        select count(*) from route_checkpoints rc
        where rc.route_id = a.route_id and rc.sentit = a.sentit
      ) as controls_esperats
    from activities a
    join routes r on r.id = a.route_id
    left join checkpoint_passes cp on cp.activity_id = a.id
    where a.user_id = ${userId}
    group by a.id, a.estat, a.sentit, a.iniciada_el, a.finalitzada_el, r.nom, r.id, a.route_id
    order by a.iniciada_el desc
  `;

  return (
    <main className="min-h-screen bg-fons">
      <div className="max-w-2xl mx-auto px-4 py-6">

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-medium text-text-principal">El meu historial</h1>
          <Link href="/perfil" className="text-sm text-pi font-medium hover:underline">
            Perfil
          </Link>
        </div>

        {activitats.length === 0 ? (
          <div className="bg-superficie border border-vora rounded-card p-12 text-center">
            <p className="text-text-secundari mb-4">Encara no has completat cap activitat.</p>
            <Link href="/" className="text-sm text-pi font-medium hover:underline">
              Explora les rutes disponibles →
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {activitats.map((a: any) => (
              <Link key={a.id} href={`/rutes/${a.ruta_id}`} className="bg-superficie border border-vora rounded-card px-4 py-4 block hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-text-principal">{a.ruta_nom}</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${ESTAT_COLORS[a.estat]}`}>
                    {ESTAT_LABELS[a.estat]}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-text-secundari">
                    {new Date(a.iniciada_el).toLocaleDateString("ca-ES", { day: "numeric", month: "long", year: "numeric" })}
                    {" · "}
                    {a.controls_validats} de {a.controls_esperats} controls
                  </p>
                  {a.temps_total && (
                    <p className="text-sm font-mono text-text-principal">
                      {formatTemps(a.temps_total)}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}
