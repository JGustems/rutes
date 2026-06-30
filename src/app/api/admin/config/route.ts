import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session || (session.user as any).rol !== "administrador") {
      return NextResponse.json({ error: "No autoritzat" }, { status: 401 });
    }

    const { clau, valor } = await req.json();

    if (!clau || valor === undefined || valor === null) {
      return NextResponse.json({ error: "Falten dades" }, { status: 400 });
    }

    await sql`
      insert into app_config (clau, valor)
      values (${clau}, ${String(valor)})
      on conflict (clau) do update set valor = ${String(valor)}
    `;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error en actualitzar configuració:", error);
    return NextResponse.json({ error: "Error intern del servidor" }, { status: 500 });
  }
}
