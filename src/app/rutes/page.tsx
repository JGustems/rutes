import { sql } from "@/lib/db";
import RutesLlistat from "./rutes-llistat";

export const dynamic = "force-dynamic";

export default async function RutesPage() {
  const rutes = await sql`
    select
      r.id, r.nom, r.categoria, r.ubicacio, r.distancia_km,
      r.desnivell_positiu_m, r.bidireccional,
      count(distinct rc.checkpoint_id) as num_checkpoints
    from routes r
    left join route_checkpoints rc on rc.route_id = r.id
    where r.estat = 'publicada'
    group by r.id
    order by r.creat_el desc
  `;

  return (
    <main className="min-h-screen bg-fons">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-xl font-medium text-text-principal mb-6">
          Totes les rutes
        </h1>
        <RutesLlistat rutes={rutes as any} />
      </div>
    </main>
  );
}
