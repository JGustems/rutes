import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ checkpointId: string }> }
) {
  try {
    const session = await auth();
    if (!session || (session.user as any).rol !== "administrador") {
      return NextResponse.json({ error: "No autoritzat" }, { status: 401 });
    }

    const { checkpointId: rcId } = await params;
    const { nom, latitud, longitud, ordre, esInici, esFi } = await req.json();

    if (!nom?.trim() || latitud == null || longitud == null || ordre == null) {
      return NextResponse.json({ error: "Falten dades obligatòries" }, { status: 400 });
    }

    const rcRows = await sql`
      select checkpoint_id from route_checkpoints where id = ${rcId} limit 1
    `;
    if (rcRows.length === 0) {
      return NextResponse.json({ error: "Checkpoint no trobat" }, { status: 404 });
    }
    const checkpointId = rcRows[0].checkpoint_id;

    await sql`
      update checkpoints
      set nom = ${nom.trim()}, latitud = ${latitud}, longitud = ${longitud}
      where id = ${checkpointId}
    `;

    await sql`
      update route_checkpoints
      set ordre = ${ordre}, es_inici = ${esInici ?? false}, es_fi = ${esFi ?? false}
      where id = ${rcId}
    `;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error en editar checkpoint:", error);
    return NextResponse.json({ error: "Error intern del servidor" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ checkpointId: string }> }
) {
  try {
    const session = await auth();
    if (!session || (session.user as any).rol !== "administrador") {
      return NextResponse.json({ error: "No autoritzat" }, { status: 401 });
    }

    const { checkpointId: rcId } = await params;

    const rcRows = await sql`
      select checkpoint_id from route_checkpoints where id = ${rcId} limit 1
    `;
    if (rcRows.length === 0) {
      return NextResponse.json({ error: "Checkpoint no trobat" }, { status: 404 });
    }
    const checkpointId = rcRows[0].checkpoint_id;

    await sql`delete from route_checkpoints where id = ${rcId}`;

    const altresRelacions = await sql`
      select id from route_checkpoints where checkpoint_id = ${checkpointId} limit 1
    `;
    if (altresRelacions.length === 0) {
      await sql`delete from checkpoints where id = ${checkpointId}`;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error en esborrar checkpoint:", error);
    return NextResponse.json({ error: "Error intern del servidor" }, { status: 500 });
  }
}
