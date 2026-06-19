"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Tag = {
  id: string;
  codi: string;
  tipus: string;
  estat: string;
  notes: string | null;
  checkpoint_nom: string | null;
};

const ESTAT_COLORS: Record<string, string> = {
  actiu: "bg-exit-clar text-exit-fosc",
  en_magatzem: "bg-terra-clar text-terra-fosc",
  de_baixa: "bg-alerta-clar text-alerta",
};

const ESTAT_LABELS: Record<string, string> = {
  actiu: "Actiu",
  en_magatzem: "En magatzem",
  de_baixa: "De baixa",
};

export default function TagItem({ tag }: { tag: Tag }) {
  const router = useRouter();
  const [carregant, setCarregant] = useState(false);

  async function canviarEstat(nouEstat: string) {
    setCarregant(true);
    await fetch(`/api/admin/tags/${tag.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estat: nouEstat }),
    });
    setCarregant(false);
    router.refresh();
  }

  async function handleEsborrar() {
    if (!confirm(`Segur que vols esborrar el tag "${tag.codi}"?`)) return;
    setCarregant(true);
    const res = await fetch(`/api/admin/tags/${tag.id}`, { method: "DELETE" });
    setCarregant(false);
    if (!res.ok) {
      const data = await res.json();
      alert(data.error ?? "Error en esborrar el tag");
      return;
    }
    router.refresh();
  }

  return (
    <div className="bg-superficie border border-vora rounded-card px-4 py-3 flex items-center justify-between">
      <div>
        <div className="flex items-center gap-2">
          <p className="text-sm font-mono text-text-principal">{tag.codi}</p>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ESTAT_COLORS[tag.estat]}`}>
            {ESTAT_LABELS[tag.estat]}
          </span>
        </div>
        <p className="text-xs text-text-secundari mt-0.5">
          {tag.checkpoint_nom ? `Assignat a: ${tag.checkpoint_nom}` : "Sense assignar a cap checkpoint"}
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <select
          value={tag.estat}
          onChange={(e) => canviarEstat(e.target.value)}
          disabled={carregant}
          className="text-xs border border-vora rounded-lg px-2 py-1 text-text-principal bg-fons focus:outline-none focus:border-pi"
        >
          <option value="actiu">Actiu</option>
          <option value="en_magatzem">En magatzem</option>
          <option value="de_baixa">De baixa</option>
        </select>
        <button onClick={handleEsborrar} disabled={carregant} className="text-xs text-alerta font-medium hover:underline disabled:opacity-50">
          Esborrar
        </button>
      </div>
    </div>
  );
}
