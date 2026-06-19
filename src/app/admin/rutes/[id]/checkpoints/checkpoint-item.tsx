"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Tag = {
  id: string;
  codi: string;
  tipus: string;
};

type Checkpoint = {
  rc_id: string;
  id: string;
  nom: string;
  latitud: number;
  longitud: number;
  ordre: number;
  es_inici: boolean;
  es_fi: boolean;
  tag_id: string | null;
  tagAssignat: Tag | null;
};

export default function CheckpointItem({
  checkpoint,
  colorBadge,
  tagsDisponibles,
}: {
  checkpoint: Checkpoint;
  colorBadge: string;
  tagsDisponibles: Tag[];
}) {
  const router = useRouter();
  const [editant, setEditant] = useState(false);
  const [carregant, setCarregant] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    nom: checkpoint.nom,
    latitud: String(checkpoint.latitud),
    longitud: String(checkpoint.longitud),
    ordre: String(checkpoint.ordre),
    esInici: checkpoint.es_inici,
    esFi: checkpoint.es_fi,
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  }

  async function handleGuardar() {
    setError("");
    if (!form.nom.trim() || !form.latitud || !form.longitud || !form.ordre) {
      setError("Tots els camps son obligatoris");
      return;
    }
    setCarregant(true);
    const res = await fetch(`/api/admin/checkpoints/${checkpoint.rc_id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nom: form.nom.trim(),
        latitud: parseFloat(form.latitud),
        longitud: parseFloat(form.longitud),
        ordre: parseInt(form.ordre),
        esInici: form.esInici,
        esFi: form.esFi,
      }),
    });
    const data = await res.json();
    setCarregant(false);
    if (!res.ok) {
      setError(data.error ?? "Error en desar els canvis");
      return;
    }
    setEditant(false);
    router.refresh();
  }

  async function handleEsborrar() {
    if (!confirm(`Segur que vols esborrar el checkpoint "${checkpoint.nom}"?`)) return;
    setCarregant(true);
    const res = await fetch(`/api/admin/checkpoints/${checkpoint.rc_id}`, { method: "DELETE" });
    setCarregant(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Error en esborrar");
      return;
    }
    router.refresh();
  }

  async function handleTagChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const nouTagId = e.target.value || null;
    setCarregant(true);
    const res = await fetch(`/api/admin/checkpoints/${checkpoint.id}/tag`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tagId: nouTagId }),
    });
    setCarregant(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Error en assignar el tag");
      return;
    }
    router.refresh();
  }

  const opcions = checkpoint.tagAssignat
    ? [checkpoint.tagAssignat, ...tagsDisponibles]
    : tagsDisponibles;

  if (editant) {
    return (
      <div className="bg-superficie border border-pi rounded-card px-4 py-4 flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-text-secundari block mb-1">Nom</label>
            <input type="text" name="nom" value={form.nom} onChange={handleChange} className="w-full border border-vora rounded-lg px-2 py-1.5 text-sm text-text-principal bg-fons focus:outline-none focus:border-pi" />
          </div>
          <div>
            <label className="text-xs font-medium text-text-secundari block mb-1">Ordre</label>
            <input type="number" name="ordre" value={form.ordre} onChange={handleChange} className="w-full border border-vora rounded-lg px-2 py-1.5 text-sm text-text-principal bg-fons focus:outline-none focus:border-pi" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-text-secundari block mb-1">Latitud</label>
            <input type="number" name="latitud" value={form.latitud} onChange={handleChange} step="0.00001" className="w-full border border-vora rounded-lg px-2 py-1.5 text-sm text-text-principal bg-fons focus:outline-none focus:border-pi" />
          </div>
          <div>
            <label className="text-xs font-medium text-text-secundari block mb-1">Longitud</label>
            <input type="number" name="longitud" value={form.longitud} onChange={handleChange} step="0.00001" className="w-full border border-vora rounded-lg px-2 py-1.5 text-sm text-text-principal bg-fons focus:outline-none focus:border-pi" />
          </div>
        </div>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" name="esInici" checked={form.esInici} onChange={handleChange} className="accent-pi w-4 h-4" />
            <span className="text-xs text-text-principal">Inici</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" name="esFi" checked={form.esFi} onChange={handleChange} className="accent-pi w-4 h-4" />
            <span className="text-xs text-text-principal">Fi</span>
          </label>
        </div>
        {error && <p className="text-xs text-alerta">{error}</p>}
        <div className="flex gap-2">
          <button onClick={handleGuardar} disabled={carregant} className="bg-pi text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-pi-fosc transition-colors disabled:opacity-50">
            {carregant ? "Desant..." : "Desar"}
          </button>
          <button onClick={() => { setEditant(false); setError(""); }} className="text-xs text-text-secundari px-3 py-1.5 hover:text-text-principal transition-colors">
            Cancel·lar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-superficie border border-vora rounded-card px-4 py-3 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`text-xs font-medium rounded-full w-6 h-6 flex items-center justify-center shrink-0 ${colorBadge}`}>
            {checkpoint.ordre}
          </span>
          <div>
            <p className="text-sm text-text-principal">
              {checkpoint.nom}
              {checkpoint.es_inici && <span className="text-xs text-pi ml-2">(Inici)</span>}
              {checkpoint.es_fi && <span className="text-xs text-terra ml-2">(Fi)</span>}
            </p>
            <p className="text-xs text-text-secundari">
              {checkpoint.latitud.toFixed(5)}, {checkpoint.longitud.toFixed(5)}
            </p>
          </div>
        </div>
        <div className="flex gap-3 shrink-0">
          <button onClick={() => setEditant(true)} className="text-xs text-pi font-medium hover:underline">Editar</button>
          <button onClick={handleEsborrar} disabled={carregant} className="text-xs text-alerta font-medium hover:underline disabled:opacity-50">Esborrar</button>
        </div>
      </div>

      <div className="flex items-center gap-2 pl-9">
        <label className="text-xs text-text-secundari shrink-0">Tag:</label>
        <select
          value={checkpoint.tag_id ?? ""}
          onChange={handleTagChange}
          disabled={carregant}
          className="text-xs border border-vora rounded-lg px-2 py-1 text-text-principal bg-fons focus:outline-none focus:border-pi flex-1"
        >
          <option value="">Sense tag assignat</option>
          {opcions.map((t) => (
            <option key={t.id} value={t.id}>
              {t.tipus.toUpperCase()} · {t.codi}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-xs text-alerta pl-9">{error}</p>}
    </div>
  );
}
