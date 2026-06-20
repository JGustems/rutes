"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AliesForm({ aliesActual }: { aliesActual: string | null }) {
  const router = useRouter();
  const [alies, setAlies] = useState(aliesActual ?? "");
  const [carregant, setCarregant] = useState(false);
  const [exit, setExit] = useState(false);

  async function handleDesar() {
    setCarregant(true);
    setExit(false);

    await fetch("/api/perfil/alies", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alies: alies.trim() || null }),
    });

    setCarregant(false);
    setExit(true);
    router.refresh();
  }

  return (
    <div className="bg-superficie border border-vora rounded-card p-5 mb-6">
      <label className="text-xs font-medium text-text-secundari block mb-1">
        Àlies per als rànquings (opcional)
      </label>
      <p className="text-xs text-text-secundari mb-3">
        Si el defineixes, es mostrarà aquest nom en lloc del teu nom real als
        rànquings públics.
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          value={alies}
          onChange={(e) => setAlies(e.target.value)}
          placeholder="p.ex. Cabra del Pirineu"
          className="flex-1 border border-vora rounded-lg px-3 py-2 text-sm text-text-principal bg-fons focus:outline-none focus:border-pi"
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
        <p className="text-xs text-exit-fosc mt-2">Àlies actualitzat correctament</p>
      )}
    </div>
  );
}
