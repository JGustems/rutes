import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autoritzat" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();
    const { localId, routeId, sentit, iniciadaEl, fontInici, passos, checkpointsEsperat } = body;

    if (!localId || !routeId || !sentit || !Array.isArray(passos)) {
      return NextResponse.json({ error: "Dades incompletes" }, { status: 400 });
    }

    const existent = await sql`
      select id from activities where user_id = ${userId} and local_id = ${localId} limit 1
    `;
    if (existent.length > 0) {
      return NextResponse.json({ id: existent[0].id, ok: true });
    }

    const idsEsperat = checkpointsEsperat.map((c: any) => c.checkpointId);
    const idsFets = new Set(passos.map((p: any) => p.checkpointId));
    const completaTots = idsEsperat.every((id: string) => idsFets.has(id));

    const ordreEsperat = checkpointsEsperat
      .slice()
      .sort((a: any, b: any) => a.ordre - b.ordre)
      .map((c: any) => c.checkpointId);
    const ordreReal = passos.map((p: any) => p.checkpointId);
    const ordreCorrecte = ordreEsperat
      .filter((id: string) => idsFets.has(id))
      .every((id: string, idx: number) => ordreReal[idx] === id);

    const estatFinal = completaTots && ordreCorrecte ? "completada" : "invalidada";

    const finalitzadaEl = passos.length > 0 ? passos[passos.length - 1].detectatEl : new Date().toISOString();
    const iniciadaElFinal = iniciadaEl ?? (passos.length > 0 ? passos[0].detectatEl : finalitzadaEl);

    const activityResult = await sql`
      insert into activities (
        local_id, user_id, route_id, sentit, iniciada_el, finalitzada_el, estat, font_inici
      ) values (
        ${localId}, ${userId}, ${routeId}, ${sentit}, ${iniciadaElFinal}, ${finalitzadaEl}, ${estatFinal}, ${fontInici}
      )
      returning id
    `;
    const activityId = activityResult[0].id;

    for (const pas of passos) {
      await sql`
        insert into checkpoint_passes (activity_id, checkpoint_id, detectat_el, font)
        values (${activityId}, ${pas.checkpointId}, ${pas.detectatEl}, ${pas.font})
        on conflict (activity_id, checkpoint_id) do nothing
      `;
    }

    return NextResponse.json({ id: activityId, estat: estatFinal, ok: true }, { status: 201 });
  } catch (error) {
    console.error("Error en sincronitzar activitat:", error);
    return NextResponse.json({ error: "Error intern del servidor" }, { status: 500 });
  }
}
