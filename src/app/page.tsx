import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const rutes = await sql`select count(*) as total from routes`;
  const total = rutes[0]?.total ?? 0;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-medium text-text-principal mb-2">
        Rutes Muntanya
      </h1>
      <p className="text-text-secundari mb-6">
        Connexio amb Neon funcionant. Rutes a la base de dades: {total}
      </p>
      <div className="flex gap-3">
        <span className="bg-pi text-white text-sm px-4 py-2 rounded-card">
          Verd pi
        </span>
        <span className="bg-cel text-white text-sm px-4 py-2 rounded-card">
          Blau sere
        </span>
        <span className="bg-terra text-white text-sm px-4 py-2 rounded-card">
          Terracota
        </span>
      </div>
    </main>
  );
}
