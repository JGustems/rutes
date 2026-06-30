"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LlindarForm({ llindarActual }: { llindarActual: number }) {
  const router = useRouter();
  const [valor, setValor] = useState(String(llindarActual));
  const [carregant, setCarregant] = useState(false);
  const [exit, setExit] = useState(false);

  async function handleDesar() {
    setCarregant(true);
    setExit(false);

    await fetch("/api/admin/config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clau: "llindar_reports_tag", valor }),
    });

    setCarregant(false);
    setExit(true);
    router.refresh();
  }

  return (
    <div className="bg-superficie border border-vora rounded-card p-5 mb-8">
      <label className="text-xs font-medium text-text-secundari block mb-1">
        Llindar d&apos;avisos per mostrar alerta als usuaris
      </label>
      <p className="text-xs text-text-secundari mb-3">
        Quan un punt de control acumuli aquest nombre d&apos;avisos pendents,
        els usuaris que el vagin a llegir veuran un missatge d&apos;alerta.
        Posa un número molt alt (per exemple 999999) si vols desactivar
        aquest avís.
      </p>
      <div className="flex gap-2">
        <input
          type="number"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          min="1"
          className="w-32 border border-vora rounded-lg px-3 py-2 text-sm text-text-principal bg-fons focus:outline-none focus:border-pi"
        />
        <button
          onClick={handleDesar}
          disabled={carregant}
          className="bg-terra text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-terra-fosc transition-colors disabled:opacity-50"
        >
          {carregant ? "Desant..." : "Desar"}
        </button>
      </div>
      {exit && (
        <p className="text-xs text-exit-fosc mt-2">Llindar actualitzat correctament</p>
      )}
    </div>
  );
}
