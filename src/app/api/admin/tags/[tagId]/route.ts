import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ tagId: string }> }
) {
  try {
    const session = await auth();
    if (!session || (session.user as any).rol !== "administrador") {
      return NextResponse.json({ error: "No autoritzat" }, { status: 401 });
    }

    const { tagId } = await params;
    const { estat } = await req.json();

    if (!estat || !["actiu", "en_magatzem", "de_baixa"].includes(estat)) {
      return NextResponse.json({ error: "Estat invalid" }, { status: 400 });
    }

    await sql`update tags set estat = ${estat} where id = ${tagId}`;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error en editar tag:", error);
    return NextResponse.json({ error: "Error intern del servidor" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ tagId: string }> }
) {
  try {
    const session = await auth();
    if (!session || (session.user as any).rol !== "administrador") {
      return NextResponse.json({ error: "No autoritzat" }, { status: 401 });
    }

    const { tagId } = await params;

    await sql`update checkpoints set tag_id = null where tag_id = ${tagId}`;
    await sql`delete from tags where id = ${tagId}`;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error en esborrar tag:", error);
    return NextResponse.json({ error: "Error intern del servidor" }, { status: 500 });
  }
}
