"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const GENERE_OPCIONS = [
  { value: "home", label: "Home" },
  { value: "dona", label: "Dona" },
  { value: "no_especificat", label: "Prefereixo no dir-ho" },
];

export default function DadesPersonalsForm({
  nomActual,
  email,
  genereActual,
}: {
  nomActual: string;
  email: string;
  genereActual: string;
}) {
  const router = useRouter();
  const [editant, setEditant] = useState(false);
  const [nom, setNom] = useState(nomActual);
  const [genere, setGenere] = useState(genereActual);
  const [carregant, setCarregant] = useState(false);
  const [error, setError] = useState("");

  async function handleDesar() {
    setError("");

    if (!nom.trim()) {
      setError("El nom no pot estar buit");
      return;
    }

    setCarregant(true);

    const res = await fetch("/api/perfil/dades", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nom: nom.trim(), genere }),
    });

    setCarregant(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Error en desar els canvis");
      return;
    }

    setEditant(false);
    router.refresh();
  }

  function handleCancelar() {
    setNom(nomActual);
    setGenere(genereActual);
    setError("");
    setEditant(false);
  }

  if (!editant) {
    return (
      <div className="bg-superficie border border-vora rounded-card p-5 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-lg font-medium text-text-principal mb-1">{nomActual}</p>
            <p className="text-sm text-text-secundari mb-1">{email}</p>
            <p className="text-xs text-text-secundari">
              {GENERE_OPCIONS.find((g) => g.value === genereActual)?.label ?? genereActual}
            </p>
          </div>
          <button
            onClick={() => setEditant(true)}
            className="text-xs text-pi font-medium hover:underline shrink-0"
          >
            Editar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-superficie border border-vora rounded-card p-5 mb-6 flex flex-col gap-3">
      <div>
        <label className="text-xs font-medium text-text-secundari block mb-1">Nom</label>
        <input
          type="text"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          className="w-full border border-vora rounded-lg px-3 py-2 text-sm text-text-principal bg-fons focus:outline-none focus:border-pi"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-text-secundari block mb-1">Email</label>
        <input
          type="text"
          value={email}
          disabled
          className="w-full border border-vora rounded-lg px-3 py-2 text-sm text-text-secundari bg-vora cursor-not-allowed"
        />
        <p className="text-xs text-text-secundari mt-1">
          L&apos;email no es pot canviar des d&apos;aquí.
        </p>
      </div>

      <div>
        <label className="text-xs font-medium text-text-secundari block mb-1">Gènere</label>
        <select
          value={genere}
          onChange={(e) => setGenere(e.target.value)}
          className="w-full border border-vora rounded-lg px-3 py-2 text-sm text-text-principal bg-fons focus:outline-none focus:border-pi"
        >
          {GENERE_OPCIONS.map((g) => (
            <option key={g.value} value={g.value}>{g.label}</option>
          ))}
        </select>
      </div>

      {error && <p className="text-xs text-alerta">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={handleDesar}
          disabled={carregant}
          className="bg-terra text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-terra-fosc transition-colors disabled:opacity-50"
        >
          {carregant ? "Desant..." : "Desar"}
        </button>
        <button
          onClick={handleCancelar}
          disabled={carregant}
          className="text-sm text-text-secundari px-4 py-2 hover:text-text-principal transition-colors"
        >
          Cancel·lar
        </button>
      </div>
    </div>
  );
}
