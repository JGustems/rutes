import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();
  if (!session || (session.user as any).rol !== "administrador") {
    redirect("/");
  }

  const [rutesRes, usersRes, tagsRes, activitatsRes, reportsRes] = await Promise.all([
    sql`select count(*) as total from routes`,
    sql`select count(*) as total from users`,
    sql`select count(*) as total from tags`,
    sql`select count(*) as total from activities`,
    sql`select count(*) as total from tag_reports where estat = 'pendent'`,
  ]);

  const stats = [
    { label: "Rutes", valor: rutesRes[0].total, href: "/admin/rutes", color: "bg-pi-clar text-pi-fosc" },
    { label: "Usuaris", valor: usersRes[0].total, href: "/admin/usuaris", color: "bg-cel-clar text-cel-fosc" },
    { label: "Tags", valor: tagsRes[0].total, href: "/admin/tags", color: "bg-terra-clar text-terra-fosc" },
    { label: "Activitats", valor: activitatsRes[0].total, href: "/admin/activitats", color: "bg-pi-clar text-pi-fosc" },
    { label: "Avisos pendents", valor: reportsRes[0].total, href: "/admin/reports", color: "bg-alerta-clar text-alerta" },
  ];

  return (
    <main className="min-h-screen bg-fons p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-medium text-text-principal">
              Panell d&apos;administració
            </h1>
            <p className="text-sm text-text-secundari mt-1">
              Benvingut, {session.user?.name}
            </p>
          </div>
          <Link href="/" className="text-sm text-text-secundari hover:text-text-principal transition-colors">
            ← Tornar a l&apos;app
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-8 sm:grid-cols-5">
          {stats.map((s) => (
            <Link key={s.label} href={s.href} className="bg-superficie border border-vora rounded-card p-4 hover:shadow-sm transition-shadow">
              <p className="text-2xl font-medium text-text-principal mb-1">{s.valor}</p>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.color}`}>{s.label}</span>
            </Link>
          ))}
        </div>
        <h2 className="text-sm font-medium text-text-secundari uppercase tracking-wide mb-3">Gestió</h2>
        <div className="flex flex-col gap-2">
          {[
            { href: "/admin/rutes", label: "Gestionar rutes", desc: "Crear, editar i publicar rutes" },
            { href: "/admin/rutes/nova", label: "Nova ruta", desc: "Afegir una ruta nova al sistema" },
            { href: "/admin/tags", label: "Gestionar tags", desc: "Inventari dels tags NFC i BLE" },
            { href: "/admin/usuaris", label: "Gestionar usuaris", desc: "Veure i gestionar els comptes" },
            { href: "/admin/reports", label: "Avisos de tags", desc: "Veure i resoldre avisos enviats pels usuaris" },
          ].map((item) => (
            <Link key={item.href} href={item.href} className="bg-superficie border border-vora rounded-card px-5 py-4 flex items-center justify-between hover:border-pi transition-colors group">
              <div>
                <p className="text-sm font-medium text-text-principal group-hover:text-pi transition-colors">{item.label}</p>
                <p className="text-xs text-text-secundari mt-0.5">{item.desc}</p>
              </div>
              <span className="text-text-secundari group-hover:text-pi transition-colors">→</span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
