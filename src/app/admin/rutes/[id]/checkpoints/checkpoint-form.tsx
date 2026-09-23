"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type CheckpointExistent = {
  id: string;
  nom: string;
  latitud: number;
  longitud: number;
  tag_codi: string | null;
};

export default function CheckpointForm({
  routeId,
  bidireccional,
  checkpointsExistents,
}: {
  routeId: string;
  bidireccional: boolean;
  checkpointsExistents: CheckpointExistent[];
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"nou" | "existent">("nou");
  const [carregant, setCarregant] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    nom: "", latitud: "", longitud: "", descripcio: "",
    ordreAnada: "", ordreTornada: "", esInici: false, esFi: false,
  });

  const [checkpointSeleccionat, setCheckpointSeleccionat] = useState("");
  const [cerca, setCerca] = useState("");
  const [ordreAnada, setOrdreAnada] = useState("");
  const [ordreTornada, setOrdreTornada] = useState("");
  const [esInici, setEsInici] = useState(false);
  const [esFi, setEsFi] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  }

  async function handleSubmitNou() {
    setError("");
    if (!form.nom.trim()) { setError("El nom del checkpoint es obligatori"); return; }
    if (!form.latitud || !form.longitud) { setError("Cal indicar latitud i longitud"); return; }
    if (!form.ordreAnada) { setError("Cal indicar l'ordre dins la ruta"); return; }
    if (bidireccional && !form.ordreTornada) { setError("Cal indicar l'ordre pel sentit de tornada"); return; }

    setCarregant(true);
    const res = await fetch(`/api/admin/rutes/${routeId}/checkpoints`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nom: form.nom.trim(),
        latitud: parseFloat(form.latitud),
        longitud: parseFloat(form.longitud),
        descripcio: form.descripcio || null,
        ordreAnada: parseInt(form.ordreAnada),
        ordreTornada: bidireccional ? parseInt(form.ordreTornada) : null,
        esInici: form.esInici,
        esFi: form.esFi,
      }),
    });
    const data = await res.json();
    setCarregant(false);
    if (!res.ok) { setError(data.error ?? "Error en afegir el checkpoint"); return; }
    setForm({ nom: "", latitud: "", longitud: "", descripcio: "", ordreAnada: "", ordreTornada: "", esInici: false, esFi: false });
    router.refresh();
  }

  async function handleSubmitExistent() {
    setError("");
    if (!checkpointSeleccionat) { setError("Selecciona un checkpoint"); return; }
    if (!ordreAnada) { setError("Cal indicar l'ordre dins la ruta"); return; }
    if (bidireccional && !ordreTornada) { setError("Cal indicar l'ordre pel sentit de tornada"); return; }

    setCarregant(true);
    const res = await fetch(`/api/admin/rutes/${routeId}/checkpoints`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        checkpointExistentId: checkpointSeleccionat,
        ordreAnada: parseInt(ordreAnada),
        ordreTornada: bidireccional ? parseInt(ordreTornada) : null,
        esInici,
        esFi,
      }),
    });
    const data = await res.json();
    setCarregant(false);
    if (!res.ok) { setError(data.error ?? "Error en afegir el checkpoint"); return; }
    setCheckpointSeleccionat("");
    setCerca("");
    setOrdreAnada("");
    setOrdreTornada("");
    setEsInici(false);
    setEsFi(false);
    router.refresh();
  }

  const checkpointsFiltrats = checkpointsExistents.filter((c) =>
    c.nom.toLowerCase().includes(cerca.toLowerCase())
  );

  return (
    <div className="bg-superficie border border-vora rounded-card p-6">
      <h3 className="text-sm font-medium text-text-principal mb-4">Afegir checkpoint</h3>

      <div className="flex gap-1 mb-5 bg-fons rounded-lg p-1">
        <button
          onClick={() => { setMode("nou"); setError(""); }}
          className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${
            mode === "nou" ? "bg-superficie shadow-sm text-text-principal" : "text-text-secundari"
          }`}
        >
          Nou checkpoint
        </button>
        <button
          onClick={() => { setMode("existent"); setError(""); }}
          className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${
            mode === "existent" ? "bg-superficie shadow-sm text-text-principal" : "text-text-secundari"
          }`}
        >
          Checkpoint existent ({checkpointsExistents.length})
        </button>
      </div>

      {mode === "nou" ? (
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium text-text-secundari block mb-1">Nom del punt *</label>
            <input type="text" name="nom" value={form.nom} onChange={handleChange} placeholder="p.ex. Font del Roure" className="w-full border border-vora rounded-lg px-3 py-2 text-sm text-text-principal bg-fons focus:outline-none focus:border-pi" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-text-secundari block mb-1">Latitud *</label>
              <input type="number" name="latitud" value={form.latitud} onChange={handleChange} placeholder="42.36621" step="0.00001" className="w-full border border-vora rounded-lg px-3 py-2 text-sm text-text-principal bg-fons focus:outline-none focus:border-pi" />
            </div>
            <div>
              <label className="text-xs font-medium text-text-secundari block mb-1">Longitud *</label>
              <input type="number" name="longitud" value={form.longitud} onChange={handleChange} placeholder="1.86420" step="0.00001" className="w-full border border-vora rounded-lg px-3 py-2 text-sm text-text-principal bg-fons focus:outline-none focus:border-pi" />
            </div>
          </div>
          <div className={`grid gap-4 ${bidireccional ? "grid-cols-2" : "grid-cols-1"}`}>
            <div>
              <label className="text-xs font-medium text-text-secundari block mb-1">Ordre {bidireccional ? "(anada) *" : "*"}</label>
              <input type="number" name="ordreAnada" value={form.ordreAnada} onChange={handleChange} placeholder="1" min="1" className="w-full border border-vora rounded-lg px-3 py-2 text-sm text-text-principal bg-fons focus:outline-none focus:border-pi" />
            </div>
            {bidireccional && (
              <div>
                <label className="text-xs font-medium text-text-secundari block mb-1">Ordre (tornada) *</label>
                <input type="number" name="ordreTornada" value={form.ordreTornada} onChange={handleChange} placeholder="1" min="1" className="w-full border border-vora rounded-lg px-3 py-2 text-sm text-text-principal bg-fons focus:outline-none focus:border-pi" />
              </div>
            )}
          </div>
          <div>
            <label className="text-xs font-medium text-text-secundari block mb-1">Descripcio</label>
            <textarea name="descripcio" value={form.descripcio} onChange={handleChange} placeholder="Notes opcionals..." rows={2} className="w-full border border-vora rounded-lg px-3 py-2 text-sm text-text-principal bg-fons focus:outline-none focus:border-pi resize-none" />
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="esInici" checked={form.esInici} onChange={handleChange} className="accent-pi w-4 h-4" />
              <span className="text-sm text-text-principal">Es l'inici</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="esFi" checked={form.esFi} onChange={handleChange} className="accent-pi w-4 h-4" />
              <span className="text-sm text-text-principal">Es el final</span>
            </label>
          </div>
          {error && <p className="text-xs text-alerta bg-alerta-clar px-3 py-2 rounded-lg">{error}</p>}
          <button onClick={handleSubmitNou} disabled={carregant} className="w-full bg-terra text-white rounded-lg py-2.5 text-sm font-medium hover:bg-terra-fosc transition-colors disabled:opacity-50">
            {carregant ? "Afegint..." : "+ Afegir checkpoint"}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {checkpointsExistents.length === 0 ? (
            <p className="text-sm text-text-secundari italic">
              No hi ha cap checkpoint disponible per reutilitzar.
            </p>
          ) : (
            <>
              <div>
                <label className="text-xs font-medium text-text-secundari block mb-1">Cerca un checkpoint existent</label>
                <input
                  type="text"
                  value={cerca}
                  onChange={(e) => setCerca(e.target.value)}
                  placeholder="Filtra per nom..."
                  className="w-full border border-vora rounded-lg px-3 py-2 text-sm text-text-principal bg-fons focus:outline-none focus:border-pi mb-2"
                />
                <div className="flex flex-col gap-1 max-h-48 overflow-y-auto border border-vora rounded-lg">
                  {checkpointsFiltrats.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setCheckpointSeleccionat(c.id)}
                      className={`text-left px-3 py-2 text-sm transition-colors ${
                        checkpointSeleccionat === c.id
                          ? "bg-pi-clar text-pi-fosc font-medium"
                          : "hover:bg-fons text-text-principal"
                      }`}
                    >
                      {c.nom}
                      {c.tag_codi && (
                        <span className="text-xs text-text-secundari ml-2">- {c.tag_codi}</span>
                      )}
                    </button>
                  ))}
                  {checkpointsFiltrats.length === 0 && (
                    <p className="text-xs text-text-secundari px-3 py-2 italic">Cap resultat</p>
                  )}
                </div>
              </div>

              <div className={`grid gap-4 ${bidireccional ? "grid-cols-2" : "grid-cols-1"}`}>
                <div>
                  <label className="text-xs font-medium text-text-secundari block mb-1">Ordre {bidireccional ? "(anada) *" : "*"}</label>
                  <input type="number" value={ordreAnada} onChange={(e) => setOrdreAnada(e.target.value)} placeholder="1" min="1" className="w-full border border-vora rounded-lg px-3 py-2 text-sm text-text-principal bg-fons focus:outline-none focus:border-pi" />
                </div>
                {bidireccional && (
                  <div>
                    <label className="text-xs font-medium text-text-secundari block mb-1">Ordre (tornada) *</label>
                    <input type="number" value={ordreTornada} onChange={(e) => setOrdreTornada(e.target.value)} placeholder="1" min="1" className="w-full border border-vora rounded-lg px-3 py-2 text-sm text-text-principal bg-fons focus:outline-none focus:border-pi" />
                  </div>
                )}
              </div>

              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={esInici} onChange={(e) => setEsInici(e.target.checked)} className="accent-pi w-4 h-4" />
                  <span className="text-sm text-text-principal">Es l'inici</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={esFi} onChange={(e) => setEsFi(e.target.checked)} className="accent-pi w-4 h-4" />
                  <span className="text-sm text-text-principal">Es el final</span>
                </label>
              </div>

              {error && <p className="text-xs text-alerta bg-alerta-clar px-3 py-2 rounded-lg">{error}</p>}
              <button
                onClick={handleSubmitExistent}
                disabled={carregant || !checkpointSeleccionat}
                className="w-full bg-terra text-white rounded-lg py-2.5 text-sm font-medium hover:bg-terra-fosc transition-colors disabled:opacity-50"
              >
                {carregant ? "Afegint..." : "+ Afegir a aquesta ruta"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
