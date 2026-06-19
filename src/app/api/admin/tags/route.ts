import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || (session.user as any).rol !== "administrador") {
      return NextResponse.json({ error: "No autoritzat" }, { status: 401 });
    }

    const { tipus, codis } = await req.json();

    if (!tipus || !["nfc", "ble"].includes(tipus)) {
      return NextResponse.json({ error: "Tipus invalid" }, { status: 400 });
    }

    if (!Array.isArray(codis) || codis.length === 0) {
      return NextResponse.json({ error: "Cal indicar almenys un codi" }, { status: 400 });
    }

    let creats = 0;
    const duplicats: string[] = [];

    for (const codiRaw of codis) {
      const codi = String(codiRaw).trim();
      if (!codi) continue;

      try {
        await sql`
          insert into tags (codi, tipus, estat)
          values (${codi}, ${tipus}, 'en_magatzem')
        `;
        creats++;
      } catch (err: any) {
        if (err?.code === "23505") {
          duplicats.push(codi);
        } else {
          throw err;
        }
      }
    }

    return NextResponse.json({ creats, duplicats }, { status: 201 });
  } catch (error) {
    console.error("Error en afegir tags:", error);
    return NextResponse.json({ error: "Error intern del servidor" }, { status: 500 });
  }
}
