import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const session = await auth();
    if (!session || (session.user as any).rol !== "administrador") {
      return NextResponse.json({ error: "No autoritzat" }, { status: 401 });
    }

    const { reportId } = await params;
    const { estat } = await req.json();

    if (!["pendent", "resolt"].includes(estat)) {
      return NextResponse.json({ error: "Estat invàlid" }, { status: 400 });
    }

    await sql`
      update tag_reports
      set estat = ${estat}, resolt_el = ${estat === "resolt" ? new Date().toISOString() : null}
      where id = ${reportId}
    `;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error en actualitzar report:", error);
    return NextResponse.json({ error: "Error intern del servidor" }, { status: 500 });
  }
}
