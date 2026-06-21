import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import Link from "next/link";
import AliesForm from "./alies-form";
import DadesPersonalsForm from "./dades-personals-form";

export const dynamic = "force-dynamic";

const GENERE_LABELS: Record<string, string> = {
  home: "Home",
  dona: "Dona",
  no_especificat: "Prefereixo no dir-ho",
};

export default async function PerfilPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/login");
  }

  const userId = (session.user as any).id;

  const usuaris = await sql`
    select nom, email, genere, alies from users where id = ${userId} limit 1
  `;
  const usuari = usuaris[0];

  const statsRows = await sql`
    select activitats_completades, rutes_diferents, km_totals, desnivell_positiu_total_m
    from user_stats
    where user_id = ${userId}
    limit 1
  `;
  const stats = statsRows[0] ?? {
    activitats_completades: 0,
    rutes_diferents: 0,
    km_totals: 0,
    desnivell_positiu_total_m: 0,
  };

  return (
    <main className="min-h-screen bg-fons">
      <div className="max-w-2xl mx-auto px-4 py-6">

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-medium text-text-principal">El meu perfil</h1>
          <Link href="/historial" className="text-sm text-pi font-medium hover:underline">
            Historial
          </Link>
        </div>

       {/* Dades personals */}
        <DadesPersonalsForm
          nomActual={usuari.nom}
          email={usuari.email}
          genereActual={usuari.genere}
        />

        {/* Alies per als ranquings */}
        <AliesForm aliesActual={usuari.alies} />

        {/* Estadistiques */}
        <h2 className="text-sm font-medium text-text-secundari uppercase tracking-wide mb-3">
          Estadístiques
        </h2>
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-superficie border border-vora rounded-card p-4">
            <p className="text-xs text-text-secundari mb-1">Activitats completades</p>
            <p className="text-2xl font-medium text-text-principal">
              {stats.activitats_completades}
            </p>
          </div>
          <div className="bg-superficie border border-vora rounded-card p-4">
            <p className="text-xs text-text-secundari mb-1">Rutes diferents</p>
            <p className="text-2xl font-medium text-text-principal">
              {stats.rutes_diferents}
            </p>
          </div>
          <div className="bg-superficie border border-vora rounded-card p-4">
            <p className="text-xs text-text-secundari mb-1">Km totals</p>
            <p className="text-2xl font-medium text-text-principal">
              {Number(stats.km_totals).toFixed(1)}
            </p>
          </div>
          <div className="bg-superficie border border-vora rounded-card p-4">
            <p className="text-xs text-text-secundari mb-1">Desnivell acumulat</p>
            <p className="text-2xl font-medium text-text-principal">
              {stats.desnivell_positiu_total_m} m
            </p>
          </div>
        </div>

        <Link
          href="/"
          className="w-full bg-terra text-white text-center rounded-lg py-3 text-sm font-medium hover:bg-terra-fosc transition-colors block"
        >
          Explorar rutes
        </Link>

      </div>
    </main>
  );
}
