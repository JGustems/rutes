import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || (session.user as any).rol !== "administrador") {
      return NextResponse.json({ error: "No autoritzat" }, { status: 401 });
    }

    const { id } = await params;

    const {
      nom, descripcio, categoria, ubicacio,
      distancia_km, desnivell_positiu_m, desnivell_negatiu_m,
      dificultat, bidireccional, estat,
    } = await req.json();

    if (!nom?.trim()) {
      return NextResponse.json({ error: "El nom de la ruta és obligatori" }, { status: 400 });
    }

    const result = await sql`
      update routes set
        nom = ${nom.trim()},
        descripcio = ${descripcio || null},
        categoria = ${categoria},
        ubicacio = ${ubicacio || null},
        distancia_km = ${distancia_km || null},
        desnivell_positiu_m = ${desnivell_positiu_m || null},
        desnivell_negatiu_m = ${desnivell_negatiu_m || null},
        dificultat = ${dificultat || 3},
        bidireccional = ${bidireccional ?? false},
        estat = ${estat || "esborrany"},
        actualitzat_el = now()
      where id = ${id}
      returning id
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: "Ruta no trobada" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error en editar la ruta:", error);
    return NextResponse.json({ error: "Error intern del servidor" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || (session.user as any).rol !== "administrador") {
      return NextResponse.json({ error: "No autoritzat" }, { status: 401 });
    }

    const { id } = await params;

    try {
      await sql`delete from routes where id = ${id}`;
    } catch (err: any) {
      if (err?.code === "23503") {
        return NextResponse.json(
          { error: "Aquesta ruta no es pot esborrar perque te activitats associades. Marca-la com 'De baixa' en lloc d'esborrar-la." },
          { status: 409 }
        );
      }
      throw err;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error en esborrar la ruta:", error);
    return NextResponse.json({ error: "Error intern del servidor" }, { status: 500 });
  }
}
