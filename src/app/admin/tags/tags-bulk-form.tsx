"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TagsBulkForm() {
  const router = useRouter();
  const [oberta, setOberta] = useState(false);
  const [tipus, setTipus] = useState<"nfc" | "ble">("nfc");
  const [codis, setCodis] = useState("");
  const [carregant, setCarregant] = useState(false);
  const [error, setError] = useState("");
  const [resultat, setResultat] = useState<{ creats: number; duplicats: string[] } | null>(null);

  async function handleSubmit() {
    setError("");
    setResultat(null);

    const llistaCodis = codis.split("\n").map((c) => c.trim()).filter((c) => c.length > 0);

    if (llistaCodis.length === 0) {
      setError("Cal introduir almenys un codi");
      return;
    }

    setCarregant(true);
    const res = await fetch("/api/admin/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipus, codis: llistaCodis }),
    });
    const data = await res.json();
    setCarregant(false);

    if (!res.ok) {
      setError(data.error ?? "Error en afegir els tags");
      return;
    }

    setResultat({ creats: data.creats, duplicats: data.duplicats ?? [] });
    setCodis("");
    router.refresh();
  }

  return (
    <div className="bg-superficie border border-vora rounded-card p-6">
      <button onClick={() => setOberta(!oberta)} className="w-full flex items-center justify-between text-sm font-medium text-text-principal">
        <span>+ Afegir tags (un o varis de cop)</span>
        <span className="text-text-secundari">{oberta ? "−" : "+"}</span>
      </button>

      {oberta && (
        <div className="flex flex-col gap-4 mt-4">
          <div>
            <label className="text-xs font-medium text-text-secundari block mb-1">Tipus</label>
            <div className="flex gap-2">
              <button onClick={() => setTipus("nfc")} className={`flex-1 text-sm py-2 rounded-lg border transition-colors ${tipus === "nfc" ? "bg-pi text-white border-pi" : "border-vora text-text-secundari"}`}>
                NFC
              </button>
              <button onClick={() => setTipus("ble")} className={`flex-1 text-sm py-2 rounded-lg border transition-colors ${tipus === "ble" ? "bg-cel text-white border-cel" : "border-vora text-text-secundari"}`}>
                BLE
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-text-secundari block mb-1">Codis (un per línia)</label>
            <textarea
              value={codis}
              onChange={(e) => setCodis(e.target.value)}
              placeholder={"04:A2:F1:9B\n04:A2:F1:9C\n04:A2:F1:9D"}
              rows={8}
              className="w-full border border-vora rounded-lg px-3 py-2 text-sm text-text-principal bg-fons focus:outline-none focus:border-pi font-mono resize-none"
            />
            <p className="text-xs text-text-secundari mt-1">
              {codis.split("\n").filter((c) => c.trim().length > 0).length} codis introduïts
            </p>
          </div>

          {error && (<p className="text-xs text-alerta bg-alerta-clar px-3 py-2 rounded-lg">{error}</p>)}

          {resultat && (
            <div className="text-xs bg-exit-clar text-exit-fosc px-3 py-2 rounded-lg">
              <p>{resultat.creats} tags creats correctament.</p>
              {resultat.duplicats.length > 0 && (
                <p className="mt-1">Codis ja existents (ignorats): {resultat.duplicats.join(", ")}</p>
              )}
            </div>
          )}

          <button onClick={handleSubmit} disabled={carregant} className="w-full bg-terra text-white rounded-lg py-2.5 text-sm font-medium hover:bg-terra-fosc transition-colors disabled:opacity-50">
            {carregant ? "Afegint..." : "Afegir tags"}
          </button>
        </div>
      )}
    </div>
  );
}
