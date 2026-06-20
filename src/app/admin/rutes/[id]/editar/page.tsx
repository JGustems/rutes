import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { sql } from "@/lib/db";
import EditarRutaForm from "./editar-ruta-form";

export const dynamic = "force-dynamic";

export default async function EditarRutaPage({
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

  return (
    <main className="min-h-screen bg-fons p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-medium text-text-principal mb-8">Editar ruta</h1>
        <EditarRutaForm ruta={ruta} />
      </div>
    </main>
  );
}
