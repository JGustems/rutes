"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const CATEGORIES = [
  { value: "km_vertical", label: "Km vertical" },
  { value: "trail_running", label: "Trail running" },
  { value: "cross", label: "Cross" },
  { value: "btt", label: "BTT" },
  { value: "carretera", label: "Carretera" },
];

type Ruta = {
  id: string;
  nom: string;
  descripcio: string | null;
  categoria: string;
  ubicacio: string | null;
  distancia_km: number | null;
  desnivell_positiu_m: number | null;
  desnivell_negatiu_m: number | null;
  dificultat: number | null;
  bidireccional: boolean;
  estat: string;
};

export default function EditarRutaForm({ ruta }: { ruta: Ruta }) {
  const router = useRouter();
  const [carregant, setCarregant] = useState(false);
  const [error, setError] = useState("");
  const [exit, setExit] = useState(false);

  const [form, setForm] = useState({
    nom: ruta.nom,
    descripcio: ruta.descripcio ?? "",
    categoria: ruta.categoria,
    ubicacio: ruta.ubicacio ?? "",
    distancia_km: ruta.distancia_km != null ? String(ruta.distancia_km) : "",
    desnivell_positiu_m: ruta.desnivell_positiu_m != null ? String(ruta.desnivell_positiu_m) : "",
    desnivell_negatiu_m: ruta.desnivell_negatiu_m != null ? String(ruta.desnivell_negatiu_m) : "",
    dificultat: ruta.dificultat != null ? String(ruta.dificultat) : "3",
    bidireccional: ruta.bidireccional,
    estat: ruta.estat,
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  }

  async function handleSubmit() {
    setError("");
    setExit(false);

    if (!form.nom.trim()) {
      setError("El nom de la ruta és obligatori");
      return;
    }

    setCarregant(true);
    const res = await fetch(`/api/admin/rutes/${ruta.id}`, {
      method: "PATCH",
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
      setError(data.error ?? "Error en desar els canvis");
      return;
    }

    setExit(true);
    router.refresh();
  }

  async function handleEsborrar() {
    if (!confirm(`Segur que vols esborrar la ruta "${ruta.nom}"? Aquesta acció no es pot desfer.`)) return;

    setCarregant(true);
    const res = await fetch(`/api/admin/rutes/${ruta.id}`, { method: "DELETE" });
    setCarregant(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Error en esborrar la ruta");
      return;
    }

    router.push("/admin/rutes");
  }

  return (
    <div className="bg-superficie border border-vora rounded-card p-6 flex flex-col gap-5">

      <div>
        <label className="text-xs font-medium text-text-secundari block mb-1">Nom de la ruta *</label>
        <input type="text" name="nom" value={form.nom} onChange={handleChange} className="w-full border border-vora rounded-lg px-3 py-2 text-sm text-text-principal bg-fons focus:outline-none focus:border-pi" />
      </div>

      <div>
        <label className="text-xs font-medium text-text-secundari block mb-1">Descripció</label>
        <textarea name="descripcio" value={form.descripcio} onChange={handleChange} rows={3} className="w-full border border-vora rounded-lg px-3 py-2 text-sm text-text-principal bg-fons focus:outline-none focus:border-pi resize-none" />
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
          <input type="text" name="ubicacio" value={form.ubicacio} onChange={handleChange} className="w-full border border-vora rounded-lg px-3 py-2 text-sm text-text-principal bg-fons focus:outline-none focus:border-pi" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="text-xs font-medium text-text-secundari block mb-1">Distància (km)</label>
          <input type="number" name="distancia_km" value={form.distancia_km} onChange={handleChange} step="0.1" min="0" className="w-full border border-vora rounded-lg px-3 py-2 text-sm text-text-principal bg-fons focus:outline-none focus:border-pi" />
        </div>
        <div>
          <label className="text-xs font-medium text-text-secundari block mb-1">Desnivell + (m)</label>
          <input type="number" name="desnivell_positiu_m" value={form.desnivell_positiu_m} onChange={handleChange} min="0" className="w-full border border-vora rounded-lg px-3 py-2 text-sm text-text-principal bg-fons focus:outline-none focus:border-pi" />
        </div>
        <div>
          <label className="text-xs font-medium text-text-secundari block mb-1">Desnivell - (m)</label>
          <input type="number" name="desnivell_negatiu_m" value={form.desnivell_negatiu_m} onChange={handleChange} min="0" className="w-full border border-vora rounded-lg px-3 py-2 text-sm text-text-principal bg-fons focus:outline-none focus:border-pi" />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-text-secundari block mb-2">Dificultat: {form.dificultat}/5</label>
        <input type="range" name="dificultat" value={form.dificultat} onChange={handleChange} min="1" max="5" step="1" className="w-full accent-pi" />
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
      {exit && (<p className="text-xs text-exit-fosc bg-exit-clar px-3 py-2 rounded-lg">Canvis desats correctament</p>)}

      <button onClick={handleSubmit} disabled={carregant} className="w-full bg-terra text-white rounded-lg py-2.5 text-sm font-medium hover:bg-terra-fosc transition-colors disabled:opacity-50">
        {carregant ? "Desant..." : "Desar canvis"}
      </button>

      <div className="flex items-center justify-between pt-2 border-t border-vora">
        <Link href={`/admin/rutes/${ruta.id}/checkpoints`} className="text-sm text-pi font-medium hover:underline">
          Gestionar checkpoints →
        </Link>
        <button onClick={handleEsborrar} disabled={carregant} className="text-sm text-alerta font-medium hover:underline disabled:opacity-50">
          Esborrar ruta
        </button>
      </div>

    </div>
  );
}
