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

    const {
      nom, latitud, longitud, descripcio,
      ordreAnada, ordreTornada, esInici, esFi,
    } = await req.json();

    if (!nom?.trim() || latitud == null || longitud == null || ordreAnada == null) {
      return NextResponse.json({ error: "Falten dades obligatòries" }, { status: 400 });
    }

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

    const checkpointResult = await sql`
      insert into checkpoints (nom, descripcio, latitud, longitud)
      values (${nom.trim()}, ${descripcio || null}, ${latitud}, ${longitud})
      returning id
    `;
    const checkpointId = checkpointResult[0].id;

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
