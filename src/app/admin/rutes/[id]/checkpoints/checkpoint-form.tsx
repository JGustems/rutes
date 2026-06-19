"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CheckpointForm({
  routeId,
  bidireccional,
}: {
  routeId: string;
  bidireccional: boolean;
}) {
  const router = useRouter();
  const [carregant, setCarregant] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    nom: "", latitud: "", longitud: "", descripcio: "",
    ordreAnada: "", ordreTornada: "", esInici: false, esFi: false,
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  }

  async function handleSubmit() {
    setError("");
    if (!form.nom.trim()) { setError("El nom del checkpoint és obligatori"); return; }
    if (!form.latitud || !form.longitud) { setError("Cal indicar latitud i longitud"); return; }
    if (!form.ordreAnada) { setError("Cal indicar l'ordre dins la ruta"); return; }
    if (bidireccional && !form.ordreTornada) { setError("Cal indicar l'ordre també pel sentit de tornada"); return; }

    setCarregant(true);
    const res = await fetch(`/api/admin/rutes/${routeId}/checkpoints`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nom: form.nom.trim(),
        latitud: parseFloat(form.latitud),
        longitud: parseFloat(form.longitud),
        descripcio: form.descripcio || null,
        ordreAnada: parseInt(form.ordreAnada),
        ordreTornada: bidireccional ? parseInt(form.ordreTornada) : null,
        esInici: form.esInici,
        esFi: form.esFi,
      }),
    });
    const data = await res.json();
    setCarregant(false);
    if (!res.ok) { setError(data.error ?? "Error en afegir el checkpoint"); return; }

    setForm({ nom: "", latitud: "", longitud: "", descripcio: "", ordreAnada: "", ordreTornada: "", esInici: false, esFi: false });
    router.refresh();
  }

  return (
    <div className="bg-superficie border border-vora rounded-card p-6">
      <h3 className="text-sm font-medium text-text-principal mb-4">Afegir checkpoint</h3>
      <div className="flex flex-col gap-4">
        <div>
          <label className="text-xs font-medium text-text-secundari block mb-1">Nom del punt *</label>
          <input type="text" name="nom" value={form.nom} onChange={handleChange} placeholder="p.ex. Font del Roure" className="w-full border border-vora rounded-lg px-3 py-2 text-sm text-text-principal bg-fons focus:outline-none focus:border-pi" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-text-secundari block mb-1">Latitud *</label>
            <input type="number" name="latitud" value={form.latitud} onChange={handleChange} placeholder="42.36621" step="0.00001" className="w-full border border-vora rounded-lg px-3 py-2 text-sm text-text-principal bg-fons focus:outline-none focus:border-pi" />
          </div>
          <div>
            <label className="text-xs font-medium text-text-secundari block mb-1">Longitud *</label>
            <input type="number" name="longitud" value={form.longitud} onChange={handleChange} placeholder="1.86420" step="0.00001" className="w-full border border-vora rounded-lg px-3 py-2 text-sm text-text-principal bg-fons focus:outline-none focus:border-pi" />
          </div>
        </div>
        <div className={`grid gap-4 ${bidireccional ? "grid-cols-2" : "grid-cols-1"}`}>
          <div>
            <label className="text-xs font-medium text-text-secundari block mb-1">Ordre {bidireccional ? "(anada) *" : "*"}</label>
            <input type="number" name="ordreAnada" value={form.ordreAnada} onChange={handleChange} placeholder="0" min="0" className="w-full border border-vora rounded-lg px-3 py-2 text-sm text-text-principal bg-fons focus:outline-none focus:border-pi" />
          </div>
          {bidireccional && (
            <div>
              <label className="text-xs font-medium text-text-secundari block mb-1">Ordre (tornada) *</label>
              <input type="number" name="ordreTornada" value={form.ordreTornada} onChange={handleChange} placeholder="0" min="0" className="w-full border border-vora rounded-lg px-3 py-2 text-sm text-text-principal bg-fons focus:outline-none focus:border-pi" />
            </div>
          )}
        </div>
        <div>
          <label className="text-xs font-medium text-text-secundari block mb-1">Descripció</label>
          <textarea name="descripcio" value={form.descripcio} onChange={handleChange} placeholder="Notes opcionals..." rows={2} className="w-full border border-vora rounded-lg px-3 py-2 text-sm text-text-principal bg-fons focus:outline-none focus:border-pi resize-none" />
        </div>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" name="esInici" checked={form.esInici} onChange={handleChange} className="accent-pi w-4 h-4" />
            <span className="text-sm text-text-principal">És l&apos;inici</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" name="esFi" checked={form.esFi} onChange={handleChange} className="accent-pi w-4 h-4" />
            <span className="text-sm text-text-principal">És el final</span>
          </label>
        </div>
        {error && (<p className="text-xs text-alerta bg-alerta-clar px-3 py-2 rounded-lg">{error}</p>)}
        <button onClick={handleSubmit} disabled={carregant} className="w-full bg-terra text-white rounded-lg py-2.5 text-sm font-medium hover:bg-terra-fosc transition-colors disabled:opacity-50">
          {carregant ? "Afegint..." : "+ Afegir checkpoint"}
        </button>
      </div>
    </div>
  );
}
