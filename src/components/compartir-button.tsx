"use client";

import { useState } from "react";

export default function CompartirButton({ activityId }: { activityId: string }) {
  const [obert, setObert] = useState(false);
  const [copiat, setCopiat] = useState(false);
  const [url, setUrl] = useState("");

  function handleObrir(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setUrl(`${window.location.origin}/activitats/${activityId}/compartir`);
    setObert(true);
    setCopiat(false);
  }

  async function handleCopiar() {
    try {
      await navigator.clipboard.writeText(url);
      setCopiat(true);
      setTimeout(() => setCopiat(false), 2000);
    } catch {
      // Si el navegador bloqueja el porta-retalls, l'usuari sempre
      // pot seleccionar el text manualment (es mostra a l'input)
    }
  }

  async function handleShareNatiu() {
    if (navigator.share) {
      try {
        await navigator.share({ url, title: "El meu resultat a Fita" });
      } catch {
        // Usuari ha cancel·lat, no cal fer res
      }
    }
  }

  return (
    <>
      <button
        onClick={handleObrir}
        className="text-xs text-pi font-medium hover:underline shrink-0"
      >
        Compartir
      </button>

      {obert && (
        <div
          className="fixed inset-0 bg-black/60 z-[2000] flex items-center justify-center p-4"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setObert(false);
          }}
        >
          <div
            className="bg-superficie rounded-card max-w-sm w-full p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-semibold text-text-principal mb-3">
              Comparteix el teu resultat
            </h3>

            <div className="flex gap-2 mb-3">
              <input
                type="text"
                readOnly
                value={url}
                onClick={(e) => (e.target as HTMLInputElement).select()}
                className="flex-1 border border-vora rounded-lg px-2 py-1.5 text-xs text-text-secundari bg-fons"
              />
              <button
                onClick={handleCopiar}
                className="bg-terra text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-terra-fosc transition-colors shrink-0"
              >
                {copiat ? "Copiat!" : "Copiar"}
              </button>
            </div>

            {typeof navigator !== "undefined" && "share" in navigator && (
              <button
                onClick={handleShareNatiu}
                className="w-full bg-cel text-white text-sm font-medium py-2 rounded-lg hover:bg-cel-fosc transition-colors mb-2"
              >
                Compartir amb una app...
              </button>
            )}

            <button
              onClick={() => setObert(false)}
              className="w-full text-sm text-text-secundari py-2 hover:text-text-principal transition-colors"
            >
              Tancar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
