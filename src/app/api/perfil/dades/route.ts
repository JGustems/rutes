import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sql } from "@/lib/db";

const GENERES_VALIDS = ["home", "dona", "no_especificat"];

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autoritzat" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { nom, genere } = await req.json();

    if (!nom || !nom.trim()) {
      return NextResponse.json({ error: "El nom no pot estar buit" }, { status: 400 });
    }

    if (!GENERES_VALIDS.includes(genere)) {
      return NextResponse.json({ error: "Gènere invàlid" }, { status: 400 });
    }

    await sql`
      update users set nom = ${nom.trim()}, genere = ${genere} where id = ${userId}
    `;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error en actualitzar dades personals:", error);
    return NextResponse.json({ error: "Error intern del servidor" }, { status: 500 });
  }
}
