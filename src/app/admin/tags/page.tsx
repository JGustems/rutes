import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import Link from "next/link";
import TagsBulkForm from "./tags-bulk-form";
import TagItem from "./tag-item";

export const dynamic = "force-dynamic";

export default async function TagsPage() {
  const session = await auth();
  if (!session || (session.user as any).rol !== "administrador") {
    redirect("/");
  }

  const tags = await sql`
    select t.id, t.codi, t.tipus, t.estat, t.notes, c.nom as checkpoint_nom
    from tags t
    left join checkpoints c on c.tag_id = t.id
    order by t.tipus asc, t.codi asc
  `;

  const nfc = tags.filter((t: any) => t.tipus === "nfc");
  const ble = tags.filter((t: any) => t.tipus === "ble");

  return (
    <main className="min-h-screen bg-fons p-6">
      <div className="max-w-2xl mx-auto">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-medium text-text-principal">Tags</h1>
            <p className="text-sm text-text-secundari mt-1">{nfc.length} NFC · {ble.length} BLE</p>
          </div>
          <Link href="/admin" className="text-sm text-text-secundari hover:text-text-principal transition-colors">
            ← Admin
          </Link>
        </div>

        <TagsBulkForm />

        <h2 className="text-sm font-medium text-text-secundari uppercase tracking-wide mb-3 mt-8">
          NFC ({nfc.length})
        </h2>
        <div className="flex flex-col gap-2 mb-8">
          {nfc.length === 0 && (<p className="text-sm text-text-secundari italic">Encara no hi ha cap tag NFC.</p>)}
          {nfc.map((t: any) => (<TagItem key={t.id} tag={t} />))}
        </div>

        <h2 className="text-sm font-medium text-text-secundari uppercase tracking-wide mb-3">
          BLE ({ble.length})
        </h2>
        <div className="flex flex-col gap-2">
          {ble.length === 0 && (<p className="text-sm text-text-secundari italic">Encara no hi ha cap tag BLE.</p>)}
          {ble.map((t: any) => (<TagItem key={t.id} tag={t} />))}
        </div>

      </div>
    </main>
  );
}
