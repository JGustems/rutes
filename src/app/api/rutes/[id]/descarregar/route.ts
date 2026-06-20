import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const url = new URL(req.url);
    const format = url.searchParams.get("format") ?? "gpx";

    if (!["gpx", "kml"].includes(format)) {
      return NextResponse.json({ error: "Format no suportat" }, { status: 400 });
    }

    const rutes = await sql`select nom from routes where id = ${id} limit 1`;
    const ruta = rutes[0];
    if (!ruta) {
      return NextResponse.json({ error: "Ruta no trobada" }, { status: 404 });
    }

    const trackRows = await sql`select geojson from route_tracks where route_id = ${id} limit 1`;
    if (trackRows.length === 0) {
      return NextResponse.json({ error: "Aquesta ruta no té track carregat" }, { status: 404 });
    }

    const geojson = trackRows[0].geojson as any;
    const nomFitxer = sanititzarNomFitxer(ruta.nom);

    if (format === "gpx") {
      const gpxContent = geojsonToGpx(geojson, ruta.nom);
      return new NextResponse(gpxContent, {
        headers: {
          "Content-Type": "application/gpx+xml",
          "Content-Disposition": `attachment; filename="${nomFitxer}.gpx"`,
        },
      });
    } else {
      const kmlContent = geojsonToKml(geojson, ruta.nom);
      return new NextResponse(kmlContent, {
        headers: {
          "Content-Type": "application/vnd.google-earth.kml+xml",
          "Content-Disposition": `attachment; filename="${nomFitxer}.kml"`,
        },
      });
    }
  } catch (error) {
    console.error("Error en generar la descarrega:", error);
    return NextResponse.json({ error: "Error intern del servidor" }, { status: 500 });
  }
}

function sanititzarNomFitxer(nom: string): string {
  return nom
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function extreureCoordenades(geojson: any): [number, number][] {
  const punts: [number, number][] = [];

  function processarGeometria(geom: any) {
    if (!geom) return;
    if (geom.type === "LineString") {
      punts.push(...geom.coordinates);
    } else if (geom.type === "MultiLineString") {
      for (const linia of geom.coordinates) {
        punts.push(...linia);
      }
    } else if (geom.type === "Point") {
      punts.push(geom.coordinates);
    }
  }

  if (geojson.type === "FeatureCollection") {
    for (const feature of geojson.features) {
      processarGeometria(feature.geometry);
    }
  } else if (geojson.type === "Feature") {
    processarGeometria(geojson.geometry);
  } else {
    processarGeometria(geojson);
  }

  return punts;
}

function geojsonToGpx(geojson: any, nom: string): string {
  const punts = extreureCoordenades(geojson);
  const trkpts = punts
    .map(([lon, lat, ele]) => {
      const eleTag = ele != null ? `<ele>${ele}</ele>` : "";
      return `      <trkpt lat="${lat}" lon="${lon}">${eleTag}</trkpt>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Rutes Muntanya" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>${escaparXml(nom)}</name>
    <trkseg>
${trkpts}
    </trkseg>
  </trk>
</gpx>`;
}

function geojsonToKml(geojson: any, nom: string): string {
  const punts = extreureCoordenades(geojson);
  const coordinates = punts
    .map(([lon, lat, ele]) => `${lon},${lat},${ele ?? 0}`)
    .join(" ");

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${escaparXml(nom)}</name>
    <Placemark>
      <name>${escaparXml(nom)}</name>
      <LineString>
        <coordinates>${coordinates}</coordinates>
      </LineString>
    </Placemark>
  </Document>
</kml>`;
}

function escaparXml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
