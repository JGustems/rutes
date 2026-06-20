import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autoritzat" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { alies } = await req.json();

    await sql`update users set alies = ${alies || null} where id = ${userId}`;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error en actualitzar l'alies:", error);
    return NextResponse.json({ error: "Error intern del servidor" }, { status: 500 });
  }
}
