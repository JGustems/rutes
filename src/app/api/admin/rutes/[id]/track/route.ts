import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sql } from "@/lib/db";
import { DOMParser } from "@xmldom/xmldom";
import { gpx, kml } from "@tmcw/togeojson";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || (session.user as any).rol !== "administrador") {
      return NextResponse.json({ error: "No autoritzat" }, { status: 401 });
    }

    const { id: routeId } = await params;

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const wikilocUrl = formData.get("wikilocUrl") as string | null;

    // Actualitzar wikiloc_url independentment de si hi ha fitxer o no
    if (wikilocUrl !== null) {
      await sql`
        update routes set wikiloc_url = ${wikilocUrl || null} where id = ${routeId}
      `;
    }

    if (!file) {
      // Nomes s'ha actualitzat wikiloc_url, sense fitxer de track
      return NextResponse.json({ ok: true, trackActualitzat: false });
    }

    const text = await file.text();
    const extensio = file.name.split(".").pop()?.toLowerCase();

    let geojson;
    const doc = new DOMParser().parseFromString(text, "text/xml");

    if (extensio === "gpx") {
      geojson = gpx(doc as any);
    } else if (extensio === "kml") {
      geojson = kml(doc as any);
    } else {
      return NextResponse.json(
        { error: "Format no suportat. Cal pujar un fitxer .gpx o .kml" },
        { status: 400 }
      );
    }

    if (!geojson.features || geojson.features.length === 0) {
      return NextResponse.json(
        { error: "No s'ha pogut extreure cap traçat del fitxer" },
        { status: 400 }
      );
    }

    // Desar (o actualitzar) el geojson a route_tracks
    await sql`
      insert into route_tracks (route_id, geojson)
      values (${routeId}, ${JSON.stringify(geojson)})
      on conflict (route_id) do update set geojson = ${JSON.stringify(geojson)}
    `;

    return NextResponse.json({ ok: true, trackActualitzat: true });
  } catch (error) {
    console.error("Error en pujar el track:", error);
    return NextResponse.json(
      { error: "Error en processar el fitxer. Comprova que sigui un GPX o KML valid." },
      { status: 500 }
    );
  }
}
