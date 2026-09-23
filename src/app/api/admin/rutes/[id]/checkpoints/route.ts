import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || (session.user as any).rol !== "administrador") {
      return NextResponse.json({ error: "No autoritzat" }, { status: 401 });
    }

    const { id: routeId } = await params;

    const body = await req.json();
    const {
      nom, latitud, longitud, descripcio,
      ordreAnada, ordreTornada, esInici, esFi,
      checkpointExistentId,
    } = body;

    const rutes = await sql`select id, bidireccional from routes where id = ${routeId} limit 1`;
    const ruta = rutes[0];
    if (!ruta) {
      return NextResponse.json({ error: "Ruta no trobada" }, { status: 404 });
    }

    if (ruta.bidireccional && ordreTornada == null) {
      return NextResponse.json(
        { error: "Cal indicar l'ordre de tornada per a una ruta bidireccional" },
        { status: 400 }
      );
    }

    let checkpointId: string;

    if (checkpointExistentId) {
      // Reutilitzem un checkpoint ja existent
      const existing = await sql`select id from checkpoints where id = ${checkpointExistentId} limit 1`;
      if (!existing[0]) {
        return NextResponse.json({ error: "Checkpoint no trobat" }, { status: 404 });
      }

      // Comprovem que no estigui ja assignat a aquesta ruta
      const jaAssignat = await sql`
        select id from route_checkpoints
        where route_id = ${routeId} and checkpoint_id = ${checkpointExistentId}
        limit 1
      `;
      if (jaAssignat[0]) {
        return NextResponse.json(
          { error: "Aquest checkpoint ja esta assignat a aquesta ruta" },
          { status: 400 }
        );
      }

      checkpointId = checkpointExistentId;
    } else {
      // Creem un checkpoint nou
      if (!nom?.trim() || latitud == null || longitud == null || ordreAnada == null) {
        return NextResponse.json({ error: "Falten dades obligatories" }, { status: 400 });
      }

      const checkpointResult = await sql`
        insert into checkpoints (nom, descripcio, latitud, longitud)
        values (${nom.trim()}, ${descripcio || null}, ${latitud}, ${longitud})
        returning id
      `;
      checkpointId = checkpointResult[0].id;
    }

    if (ordreAnada == null) {
      return NextResponse.json({ error: "Cal indicar l'ordre dins la ruta" }, { status: 400 });
    }

    await sql`
      insert into route_checkpoints (route_id, checkpoint_id, sentit, ordre, es_inici, es_fi)
      values (${routeId}, ${checkpointId}, 'anada', ${ordreAnada}, ${esInici ?? false}, ${esFi ?? false})
    `;

    if (ruta.bidireccional && ordreTornada != null) {
      await sql`
        insert into route_checkpoints (route_id, checkpoint_id, sentit, ordre, es_inici, es_fi)
        values (${routeId}, ${checkpointId}, 'tornada', ${ordreTornada}, ${esFi ?? false}, ${esInici ?? false})
      `;
    }

    return NextResponse.json({ id: checkpointId }, { status: 201 });
  } catch (error) {
    console.error("Error en afegir checkpoint:", error);
    return NextResponse.json({ error: "Error intern del servidor" }, { status: 500 });
  }
}
