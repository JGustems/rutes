"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CATEGORIES = [
  { value: "km_vertical", label: "Km vertical" },
  { value: "trail_running", label: "Trail running" },
  { value: "cross", label: "Cross" },
  { value: "btt", label: "BTT" },
  { value: "carretera", label: "Carretera" },
];

export default function NovaRutaPage() {
  const router = useRouter();
  const [carregant, setCarregant] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    nom: "",
    descripcio: "",
    categoria: "trail_running",
    ubicacio: "",
    distancia_km: "",
    desnivell_positiu_m: "",
    desnivell_negatiu_m: "",
    dificultat: "3",
    bidireccional: false,
    estat: "esborrany",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  }

  async function handleSubmit() {
    setError("");
    if (!form.nom.trim()) {
      setError("El nom de la ruta és obligatori");
      return;
    }
    setCarregant(true);
    const res = await fetch("/api/admin/rutes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        distancia_km: form.distancia_km ? parseFloat(form.distancia_km) : null,
        desnivell_positiu_m: form.desnivell_positiu_m ? parseInt(form.desnivell_positiu_m) : null,
        desnivell_negatiu_m: form.desnivell_negatiu_m ? parseInt(form.desnivell_negatiu_m) : null,
        dificultat: parseInt(form.dificultat),
      }),
    });
    const data = await res.json();
    setCarregant(false);
    if (!res.ok) {
      setError(data.error ?? "Error en crear la ruta");
      return;
    }
    router.push(`/admin/rutes/${data.id}/checkpoints`);
  }

  return (
    <main className="min-h-screen bg-fons p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-medium text-text-principal">Nova ruta</h1>
          <button onClick={() => router.push("/admin/rutes")} className="text-sm text-text-secundari hover:text-text-principal transition-colors">
            ← Cancel·lar
          </button>
        </div>
        <div className="bg-superficie border border-vora rounded-card p-6 flex flex-col gap-5">
          <div>
            <label className="text-xs font-medium text-text-secundari block mb-1">Nom de la ruta *</label>
            <input type="text" name="nom" value={form.nom} onChange={handleChange} placeholder="p.ex. Ruta del Comabona" className="w-full border border-vora rounded-lg px-3 py-2 text-sm text-text-principal bg-fons focus:outline-none focus:border-pi" />
          </div>
          <div>
            <label className="text-xs font-medium text-text-secundari block mb-1">Descripció</label>
            <textarea name="descripcio" value={form.descripcio} onChange={handleChange} placeholder="Descripció de la ruta..." rows={3} className="w-full border border-vora rounded-lg px-3 py-2 text-sm text-text-principal bg-fons focus:outline-none focus:border-pi resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-text-secundari block mb-1">Categoria *</label>
              <select name="categoria" value={form.categoria} onChange={handleChange} className="w-full border border-vora rounded-lg px-3 py-2 text-sm text-text-principal bg-fons focus:outline-none focus:border-pi">
                {CATEGORIES.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-text-secundari block mb-1">Ubicació</label>
              <input type="text" name="ubicacio" value={form.ubicacio} onChange={handleChange} placeholder="p.ex. Alp, Estoll..." className="w-full border border-vora rounded-lg px-3 py-2 text-sm text-text-principal bg-fons focus:outline-none focus:border-pi" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-text-secundari block mb-1">Distància (km)</label>
              <input type="number" name="distancia_km" value={form.distancia_km} onChange={handleChange} placeholder="14.2" step="0.1" min="0" className="w-full border border-vora rounded-lg px-3 py-2 text-sm text-text-principal bg-fons focus:outline-none focus:border-pi" />
            </div>
            <div>
              <label className="text-xs font-medium text-text-secundari block mb-1">Desnivell + (m)</label>
              <input type="number" name="desnivell_positiu_m" value={form.desnivell_positiu_m} onChange={handleChange} placeholder="820" min="0" className="w-full border border-vora rounded-lg px-3 py-2 text-sm text-text-principal bg-fons focus:outline-none focus:border-pi" />
            </div>
            <div>
              <label className="text-xs font-medium text-text-secundari block mb-1">Desnivell - (m)</label>
              <input type="number" name="desnivell_negatiu_m" value={form.desnivell_negatiu_m} onChange={handleChange} placeholder="820" min="0" className="w-full border border-vora rounded-lg px-3 py-2 text-sm text-text-principal bg-fons focus:outline-none focus:border-pi" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-text-secundari block mb-2">Dificultat: {form.dificultat}/5</label>
            <input type="range" name="dificultat" value={form.dificultat} onChange={handleChange} min="1" max="5" step="1" className="w-full accent-pi" />
            <div className="flex justify-between text-xs text-text-secundari mt-1">
              <span>Fàcil</span><span>Molt difícil</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="bidireccional" checked={form.bidireccional} onChange={handleChange} className="accent-pi w-4 h-4" />
              <span className="text-sm text-text-principal">Ruta bidireccional</span>
            </label>
            <select name="estat" value={form.estat} onChange={handleChange} className="border border-vora rounded-lg px-3 py-2 text-sm text-text-principal bg-fons focus:outline-none focus:border-pi">
              <option value="esborrany">Esborrany</option>
              <option value="publicada">Publicada</option>
              <option value="de_baixa">De baixa</option>
            </select>
          </div>
          {error && (<p className="text-xs text-alerta bg-alerta-clar px-3 py-2 rounded-lg">{error}</p>)}
          <button onClick={handleSubmit} disabled={carregant} className="w-full bg-terra text-white rounded-lg py-2.5 text-sm font-medium hover:bg-terra-fosc transition-colors disabled:opacity-50">
            {carregant ? "Creant ruta..." : "Crear ruta i afegir checkpoints →"}
          </button>
        </div>
      </div>
    </main>
  );
}
