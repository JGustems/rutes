import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user ? (session.user as any).id : null;

    const { checkpointId, motiu } = await req.json();

    if (!checkpointId) {
      return NextResponse.json({ error: "Falta el checkpoint" }, { status: 400 });
    }

    await sql`
      insert into tag_reports (checkpoint_id, user_id, motiu)
      values (${checkpointId}, ${userId}, ${motiu || null})
    `;

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Error en crear report de tag:", error);
    return NextResponse.json({ error: "Error intern del servidor" }, { status: 500 });
  }
}
