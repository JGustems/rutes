"use client";

import { useState } from "react";

export default function CompartirButton({ activityId }: { activityId: string }) {
  const [copiat, setCopiat] = useState(false);

  async function handleCopiar(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    const url = `${window.location.origin}/activitats/${activityId}/compartir`;

    if (navigator.share) {
      try {
        await navigator.share({ url, title: "El meu resultat a Fita" });
        return;
      } catch {
        // Si l'usuari cancel·la el share natiu, seguim amb copiar
      }
    }

    await navigator.clipboard.writeText(url);
    setCopiat(true);
    setTimeout(() => setCopiat(false), 2000);
  }

  return (
    <button onClick={handleCopiar} className="text-xs text-pi font-medium hover:underline shrink-0">
      {copiat ? "Enllaç copiat!" : "Compartir"}
    </button>
  );
}
