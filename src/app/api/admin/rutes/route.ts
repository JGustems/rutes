import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || (session.user as any).rol !== "administrador") {
      return NextResponse.json({ error: "No autoritzat" }, { status: 401 });
    }

    const {
      nom, descripcio, categoria, ubicacio,
      distancia_km, desnivell_positiu_m, desnivell_negatiu_m,
      dificultat, bidireccional, estat,
    } = await req.json();

    if (!nom?.trim()) {
      return NextResponse.json(
        { error: "El nom de la ruta és obligatori" },
        { status: 400 }
      );
    }

    const result = await sql`
      insert into routes (
        nom, descripcio, categoria, ubicacio,
        distancia_km, desnivell_positiu_m, desnivell_negatiu_m,
        dificultat, bidireccional, estat
      ) values (
        ${nom.trim()},
        ${descripcio || null},
        ${categoria},
        ${ubicacio || null},
        ${distancia_km || null},
        ${desnivell_positiu_m || null},
        ${desnivell_negatiu_m || null},
        ${dificultat || 3},
        ${bidireccional ?? false},
        ${estat || "esborrany"}
      )
      returning id
    `;

    return NextResponse.json({ id: result[0].id }, { status: 201 });
  } catch (error) {
    console.error("Error en crear la ruta:", error);
    return NextResponse.json(
      { error: "Error intern del servidor" },
      { status: 500 }
    );
  }
}
