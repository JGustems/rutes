"use client";

import { useState } from "react";

export default function AvisarTagButton({
  checkpointId,
  className,
}: {
  checkpointId: string;
  className?: string;
}) {
  const [obert, setObert] = useState(false);
  const [motiu, setMotiu] = useState("");
  const [carregant, setCarregant] = useState(false);
  const [enviat, setEnviat] = useState(false);

  async function handleEnviar() {
    setCarregant(true);
    await fetch("/api/tag-reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checkpointId, motiu: motiu.trim() || null }),
    });
    setCarregant(false);
    setEnviat(true);
  }

  if (enviat) {
    return (
      <p className={`text-xs text-exit-fosc ${className ?? ""}`}>
        Gràcies, hem rebut el teu avís sobre aquest punt.
      </p>
    );
  }

  if (!obert) {
    return (
      <button
        onClick={() => setObert(true)}
        className={`text-xs text-text-secundari hover:text-alerta transition-colors underline ${className ?? ""}`}
      >
        Aquest punt no funciona?
      </button>
    );
  }

  return (
    <div className={`bg-fons border border-vora rounded-lg p-3 flex flex-col gap-2 ${className ?? ""}`}>
      <p className="text-xs text-text-principal">
        Avisar que aquest tag no respon o sembla malmès
      </p>
      <textarea
        value={motiu}
        onChange={(e) => setMotiu(e.target.value)}
        placeholder="Detalls opcionals (què passa exactament)..."
        rows={2}
        className="w-full border border-vora rounded-lg px-2 py-1.5 text-xs text-text-principal bg-superficie focus:outline-none focus:border-pi resize-none"
      />
      <div className="flex gap-2">
        <button
          onClick={handleEnviar}
          disabled={carregant}
          className="bg-alerta text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {carregant ? "Enviant..." : "Enviar avís"}
        </button>
        <button
          onClick={() => setObert(false)}
          className="text-xs text-text-secundari px-2 hover:text-text-principal transition-colors"
        >
          Cancel·lar
        </button>
      </div>
    </div>
  );
}
