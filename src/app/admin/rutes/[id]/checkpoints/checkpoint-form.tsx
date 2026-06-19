"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TrackForm({
  routeId,
  wikilocUrlActual,
  teTrack,
}: {
  routeId: string;
  wikilocUrlActual: string | null;
  teTrack: boolean;
}) {
  const router = useRouter();
  const [oberta, setOberta] = useState(false);
  const [wikilocUrl, setWikilocUrl] = useState(wikilocUrlActual ?? "");
  const [fitxer, setFitxer] = useState<File | null>(null);
  const [carregant, setCarregant] = useState(false);
  const [error, setError] = useState("");
  const [exit, setExit] = useState("");

  async function handleSubmit() {
    setError("");
    setExit("");
    setCarregant(true);

    const formData = new FormData();
    formData.append("wikilocUrl", wikilocUrl.trim());
    if (fitxer) {
      formData.append("file", fitxer);
    }

    const res = await fetch(`/api/admin/rutes/${routeId}/track`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setCarregant(false);

    if (!res.ok) {
      setError(data.error ?? "Error en desar");
      return;
    }

    setExit(data.trackActualitzat ? "Track pujat i enllaç desats correctament" : "Enllaç desat correctament");
    setFitxer(null);
    router.refresh();
  }

  return (
    <div className="bg-superficie border border-vora rounded-card p-6 mb-6">
      <button onClick={() => setOberta(!oberta)} className="w-full flex items-center justify-between text-sm font-medium text-text-principal">
        <span>Track i Wikiloc {teTrack && <span className="text-exit-fosc">(track carregat)</span>}</span>
        <span className="text-text-secundari">{oberta ? "−" : "+"}</span>
      </button>

      {oberta && (
        <div className="flex flex-col gap-4 mt-4">
          <div>
            <label className="text-xs font-medium text-text-secundari block mb-1">Fitxer de track (.gpx o .kml)</label>
            <input type="file" accept=".gpx,.kml" onChange={(e) => setFitxer(e.target.files?.[0] ?? null)} className="w-full text-sm text-text-principal" />
            {teTrack && !fitxer && (
              <p className="text-xs text-text-secundari mt-1">Ja hi ha un track carregat. Puja un fitxer nou per substituir-lo.</p>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-text-secundari block mb-1">Enllaç a Wikiloc (opcional)</label>
            <input
              type="url"
              value={wikilocUrl}
              onChange={(e) => setWikilocUrl(e.target.value)}
              placeholder="https://www.wikiloc.com/..."
              className="w-full border border-vora rounded-lg px-3 py-2 text-sm text-text-principal bg-fons focus:outline-none focus:border-pi"
            />
          </div>

          {error && (<p className="text-xs text-alerta bg-alerta-clar px-3 py-2 rounded-lg">{error}</p>)}
          {exit && (<p className="text-xs text-exit-fosc bg-exit-clar px-3 py-2 rounded-lg">{exit}</p>)}

          <button onClick={handleSubmit} disabled={carregant} className="w-full bg-terra text-white rounded-lg py-2.5 text-sm font-medium hover:bg-terra-fosc transition-colors disabled:opacity-50">
            {carregant ? "Desant..." : "Desar"}
          </button>
        </div>
      )}
    </div>
  );
}
