import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ checkpointId: string }> }
) {
  try {
    const session = await auth();
    if (!session || (session.user as any).rol !== "administrador") {
      return NextResponse.json({ error: "No autoritzat" }, { status: 401 });
    }

    const { checkpointId } = await params;
    const { tagId } = await req.json();

    const checkpoints = await sql`
      select id from checkpoints where id = ${checkpointId} limit 1
    `;
    if (checkpoints.length === 0) {
      return NextResponse.json({ error: "Checkpoint no trobat" }, { status: 404 });
    }

    if (tagId) {
      const tags = await sql`select id, estat from tags where id = ${tagId} limit 1`;
      if (tags.length === 0) {
        return NextResponse.json({ error: "Tag no trobat" }, { status: 404 });
      }
      if (tags[0].estat !== "actiu") {
        return NextResponse.json(
          { error: "Nomes es poden assignar tags amb estat 'actiu'" },
          { status: 400 }
        );
      }

      const jaAssignat = await sql`
        select id from checkpoints where tag_id = ${tagId} and id != ${checkpointId} limit 1
      `;
      if (jaAssignat.length > 0) {
        return NextResponse.json(
          { error: "Aquest tag ja esta assignat a un altre checkpoint" },
          { status: 409 }
        );
      }
    }

    await sql`update checkpoints set tag_id = ${tagId || null} where id = ${checkpointId}`;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error en assignar tag:", error);
    return NextResponse.json({ error: "Error intern del servidor" }, { status: 500 });
  }
}
