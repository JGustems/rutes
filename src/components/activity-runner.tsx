"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  type ActivitatLocal,
  obtenirActivitat,
  desarActivitat,
  esborrarActivitat,
  seguentCheckpointEsperat,
  activitatCompletada,
} from "@/lib/activity-storage";
import QrScannerButton from "./qr-scanner-button";
import AvisarTagButton from "./avisar-tag-button";

type CheckpointInfo = {
  checkpointId: string;
  nom: string;
  ordre: number;
  esInici: boolean;
  esFi: boolean;
  tagCodi: string | null;
  tagTipus: "nfc" | "ble" | null;
  numReportsPendents?: number;
};

function normalitzarCodi(codi: string): string {
  return codi.trim().toLowerCase().replace(/[\s:.-]/g, "");
}

function checkpointsOrdenatsPerSentit(
  checkpoints: CheckpointInfo[],
  sentit: "anada" | "tornada"
): CheckpointInfo[] {
  const ordenats = [...checkpoints].sort((a, b) => a.ordre - b.ordre);
  if (sentit === "anada") return ordenats;
  return [...ordenats].reverse();
}

function esCircular(checkpoints: CheckpointInfo[]): boolean {
  const ordenats = [...checkpoints].sort((a, b) => a.ordre - b.ordre);
  const primer = ordenats[0];
  const darrer = ordenats[ordenats.length - 1];
  if (!primer?.tagCodi || !darrer?.tagCodi) return false;
  return normalitzarCodi(primer.tagCodi) === normalitzarCodi(darrer.tagCodi);
}

// Detecta el sentit a partir del primer tag (ruta lineal)
// Retorna "anada", "tornada", "pendent" (circular, cal segon tag),
// o null si es un punt intermedi
function detectarSentitPrimerTag(
  codiDetectat: string,
  checkpoints: CheckpointInfo[]
): "anada" | "tornada" | "pendent" | null {
  const ordenats = [...checkpoints].sort((a, b) => a.ordre - b.ordre);
  const primer = ordenats[0];
  const darrer = ordenats[ordenats.length - 1];

  if (primer?.tagCodi && normalitzarCodi(primer.tagCodi) === codiDetectat) {
    if (esCircular(checkpoints)) return "pendent"; // Ambigu fins al segon tag
    return "anada";
  }
  if (!esCircular(checkpoints) && darrer?.tagCodi &&
    normalitzarCodi(darrer.tagCodi) === codiDetectat) {
    return "tornada";
  }
  return null; // Punt intermedi, cal tria manual
}

// Detecta el sentit a partir del segon tag (ruta circular)
function detectarSentitSegonTag(
  codiDetectat: string,
  checkpoints: CheckpointInfo[]
): "anada" | "tornada" | null {
  const ordenats = [...checkpoints].sort((a, b) => a.ordre - b.ordre);
  // Segon en ordre = anada
  const segon = ordenats[1];
  if (segon?.tagCodi && normalitzarCodi(segon.tagCodi) === codiDetectat) {
    return "anada";
  }
  // Penultim en ordre = tornada
  const penultim = ordenats[ordenats.length - 2];
  if (penultim?.tagCodi && normalitzarCodi(penultim.tagCodi) === codiDetectat) {
    return "tornada";
  }
  return null;
}

export default function ActivityRunner({
  routeId,
  routeNom,
  checkpoints,
  llindarReports,
  bidireccional = false,
}: {
  routeId: string;
  routeNom: string;
  checkpoints: CheckpointInfo[];
  llindarReports: number;
  bidireccional?: boolean;
}) {
  const router = useRouter();
  const [activitat, setActivitat] = useState<ActivitatLocal | null>(null);
  const [codiManual, setCodiManual] = useState("");
  const [missatge, setMissatge] = useState<{ tipus: "ok" | "error"; text: string } | null>(null);
  const [nfcDisponible, setNfcDisponible] = useState(false);
  const [bleConnectant, setBleConnectant] = useState(false);
  const [sincronitzant, setSincronitzant] = useState(false);
  const [mostrantAvis, setMostrantAvis] = useState(false);
  const [iniciada, setIniciada] = useState(false); // Avis acceptat, esperant primer tag

  useEffect(() => {
    const existent = obtenirActivitat();
    if (existent && existent.routeId === routeId) {
      setActivitat(existent);
      if (existent.sentit === "pendent" || existent.passos.length > 0) {
        setIniciada(true);
      }
    }
    setNfcDisponible(typeof window !== "undefined" && "NDEFReader" in window);
  }, [routeId]);

  const [, forcarActualitzacio] = useState(0);
  useEffect(() => {
    if (!activitat || activitatCompletada(activitat)) return;
    const interval = setInterval(() => {
      forcarActualitzacio((n) => n + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [activitat]);

  const mostrarMissatge = useCallback((tipus: "ok" | "error", text: string) => {
    setMissatge({ tipus, text });
    setTimeout(() => setMissatge(null), 15000);
  }, []);

  function crearActivitatAmbSentit(
    sentit: "anada" | "tornada" | "pendent",
    font: "nfc" | "ble" | "manual"
  ): ActivitatLocal {
    // Si el sentit ja es conegut, ordenem els checkpoints correctament
    // Si es pendent (circular), posem tots en ordre d'anada de moment
    const cps = sentit === "tornada"
      ? checkpointsOrdenatsPerSentit(checkpoints, "tornada")
      : [...checkpoints].sort((a, b) => a.ordre - b.ordre);

    return {
      localId: typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : String(Date.now()),
      routeId,
      sentit,
      iniciadaEl: null,
      fontInici: font,
      passos: [],
      checkpointsEsperat: cps.map((c, idx) => ({
        checkpointId: c.checkpointId,
        ordre: idx + 1,
        tagCodi: c.tagCodi,
      })),
    };
  }

  function confirmarSentitIReordenar(
    activitatPendent: ActivitatLocal,
    sentit: "anada" | "tornada"
  ): ActivitatLocal {
    // Reordena els checkpoints restants (els que encara no s'han fet)
    // segons el sentit confirmat
    const cps = checkpointsOrdenatsPerSentit(checkpoints, sentit);
    const idsFets = new Set(activitatPendent.passos.map((p) => p.checkpointId));

    // Els passos ja fets queden igual, reordenem la resta
    const restaOrdenada = cps
      .filter((c) => !idsFets.has(c.checkpointId))
      .map((c, idx) => ({
        checkpointId: c.checkpointId,
        ordre: activitatPendent.passos.length + idx + 1,
        tagCodi: c.tagCodi,
      }));

    const fets = activitatPendent.passos.map((p, idx) => {
      const cp = checkpoints.find((c) => c.checkpointId === p.checkpointId);
      return { checkpointId: p.checkpointId, ordre: idx + 1, tagCodi: cp?.tagCodi ?? null };
    });

    return {
      ...activitatPendent,
      sentit,
      checkpointsEsperat: [...fets, ...restaOrdenada],
    };
  }

  function registrarPas(codiDetectatRaw: string, font: "nfc" | "ble" | "manual") {
    const codiDetectat = normalitzarCodi(codiDetectatRaw);

    // ---- CAS 1: Bidireccional, sense activitat iniciada ----
    // Primer tag, intentem detectar el sentit
    if (bidireccional && !activitat && iniciada) {
      const sentitDetectat = detectarSentitPrimerTag(codiDetectat, checkpoints);

      if (sentitDetectat === null) {
        mostrarMissatge("error", "No hem pogut determinar el sentit. Tria'l manualment.");
        return;
      }

      const araIso = new Date().toISOString();
      const nova = crearActivitatAmbSentit(sentitDetectat, font);

      // Registrem el primer pas
      const primerCp = nova.checkpointsEsperat[0];
      if (primerCp && normalitzarCodi(primerCp.tagCodi ?? "") === codiDetectat) {
        nova.iniciadaEl = araIso;
        nova.passos = [{ checkpointId: primerCp.checkpointId, detectatEl: araIso, font }];
      }

      if (sentitDetectat === "pendent") {
        mostrarMissatge("ok", "Primer punt registrat. Llegeix el segon per confirmar el sentit.");
      } else {
        mostrarMissatge("ok",
          sentitDetectat === "anada" ? "Sentit anada detectat ✓" : "Sentit tornada detectat ✓"
        );
      }

      desarActivitat(nova);
      setActivitat(nova);
      return;
    }

    // ---- CAS 2: Activitat amb sentit pendent (circular, segon tag) ----
    if (activitat?.sentit === "pendent") {
      const sentitConfirmat = detectarSentitSegonTag(codiDetectat, checkpoints);

      if (sentitConfirmat === null) {
        mostrarMissatge("error", "Tag no reconegut com a segon punt de cap sentit. Tria el sentit manualment.");
        return;
      }

      const araIso = new Date().toISOString();
      const actualitzada = confirmarSentitIReordenar(activitat, sentitConfirmat);

      // Registrem aquest segon pas
      const seguentEsperat = actualitzada.checkpointsEsperat.find(
        (c) => !actualitzada.passos.some((p) => p.checkpointId === c.checkpointId)
      );
      if (seguentEsperat && normalitzarCodi(seguentEsperat.tagCodi ?? "") === codiDetectat) {
        actualitzada.passos = [
          ...actualitzada.passos,
          { checkpointId: seguentEsperat.checkpointId, detectatEl: araIso, font },
        ];
      }

      mostrarMissatge("ok",
        sentitConfirmat === "anada" ? "Sentit anada confirmat ✓" : "Sentit tornada confirmat ✓"
      );
      desarActivitat(actualitzada);
      setActivitat(actualitzada);
      return;
    }

    // ---- CAS 3: Activitat normal en curs ----
    setActivitat((actual) => {
      if (!actual) return actual;
      const esperat = seguentCheckpointEsperat(actual);
      if (!esperat) {
        mostrarMissatge("error", "Ja s'han completat tots els punts de control");
        return actual;
      }
      if (normalitzarCodi(esperat.tagCodi ?? "") !== codiDetectat) {
        mostrarMissatge("error", "Aquest codi no correspon al següent punt de control esperat");
        return actual;
      }
      const araIso = new Date().toISOString();
      const esPrimerPas = actual.passos.length === 0;
      const nouPas = { checkpointId: esperat.checkpointId, detectatEl: araIso, font };
      const actualitzada: ActivitatLocal = {
        ...actual,
        iniciadaEl: esPrimerPas ? araIso : actual.iniciadaEl,
        passos: [...actual.passos, nouPas],
      };
      desarActivitat(actualitzada);
      mostrarMissatge("ok", "Punt de control validat!");
      return actualitzada;
    });
  }

  function iniciarAmbSentitManual(sentit: "anada" | "tornada") {
    const nova = crearActivitatAmbSentit(sentit, "manual");
    desarActivitat(nova);
    setActivitat(nova);
  }

  function abandonar() {
    if (!confirm("Segur que vols abandonar? Es perdrà el progrés.")) return;
    esborrarActivitat();
    setActivitat(null);
    setIniciada(false);
  }

  async function escoltarNFC() {
    if (!nfcDisponible) {
      mostrarMissatge("error", "Aquest dispositiu o navegador no suporta NFC");
      return;
    }
    try {
      const reader = new (window as any).NDEFReader();
      await reader.scan();
      mostrarMissatge("ok", "Escoltant NFC... acosta el mòbil al tag");
      reader.onreading = (event: any) => {
        registrarPas(event.serialNumber as string, "nfc");
      };
    } catch {
      mostrarMissatge("error", "No s'ha pogut activar el lector NFC");
    }
  }

  async function connectarBLE() {
    if (typeof navigator === "undefined" || !("bluetooth" in navigator)) {
      mostrarMissatge("error", "Aquest dispositiu o navegador no suporta Bluetooth");
      return;
    }
    setBleConnectant(true);
    try {
      const device = await (navigator as any).bluetooth.requestDevice({ acceptAllDevices: true });
      registrarPas(device.name || device.id, "ble");
    } catch {
      mostrarMissatge("error", "No s'ha trobat o connectat cap dispositiu Bluetooth");
    } finally {
      setBleConnectant(false);
    }
  }

  function enviarCodiManual() {
    if (!codiManual.trim()) return;
    registrarPas(codiManual.trim(), "manual");
    setCodiManual("");
  }

  async function sincronitzar() {
    if (!activitat) return;
    setSincronitzant(true);
    const res = await fetch("/api/activitats/sincronitzar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(activitat),
    });
    setSincronitzant(false);
    if (!res.ok) {
      const data = await res.json();
      mostrarMissatge("error", data.error ?? "Error en sincronitzar");
      return;
    }
    esborrarActivitat();
    router.push("/historial");
  }

  // ---- Botons de deteccio (reutilitzats en diversos estats) ----
  function BotonsDeteccio({ checkpointInfo }: { checkpointInfo?: CheckpointInfo }) {
    return (
      <div className="flex flex-col gap-3">
        {(checkpointInfo?.tagTipus === "nfc" || !checkpointInfo) && (
          <button
            onClick={escoltarNFC}
            disabled={!nfcDisponible}
            className="w-full bg-pi text-white rounded-lg py-2.5 text-sm font-medium hover:bg-pi-fosc transition-colors disabled:opacity-40"
          >
            {nfcDisponible ? "Escoltar NFC" : "NFC no disponible"}
          </button>
        )}
        <div className="flex gap-2">
          {(checkpointInfo?.tagTipus === "ble" || !checkpointInfo) && (
            <button
              onClick={connectarBLE}
              disabled={bleConnectant}
              className="flex-1 bg-cel text-white rounded-lg py-2.5 text-sm font-medium hover:bg-cel-fosc transition-colors disabled:opacity-50"
            >
              {bleConnectant ? "Connectant..." : "Connectar Bluetooth"}
            </button>
          )}
          <QrScannerButton onScan={(codi) => registrarPas(codi, "manual")} />
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={codiManual}
            onChange={(e) => setCodiManual(e.target.value)}
            placeholder="Introdueix el codi manualment"
            className="flex-1 border border-vora rounded-lg px-3 py-2 text-sm text-text-principal bg-fons focus:outline-none focus:border-pi"
          />
          <button
            onClick={enviarCodiManual}
            className="bg-terra text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-terra-fosc transition-colors"
          >
            Validar
          </button>
        </div>
      </div>
    );
  }

  // ---- RENDER: pantalla inicial ----
  if (!activitat && !iniciada) {
    return (
      <div className="bg-superficie border border-vora rounded-card p-6 text-center">
        <p className="text-sm text-text-secundari mb-4">
          Preparat per començar la ruta &quot;{routeNom}&quot;?
        </p>
        {bidireccional && (
          <p className="text-xs bg-cel-clar text-cel-fosc px-3 py-2 rounded-lg mb-4">
            Ruta bidireccional — detectarem el sentit automàticament
            quan llegeixis el primer tag.
          </p>
        )}
        <button
          onClick={() => setMostrantAvis(true)}
          className="w-full bg-terra text-white rounded-lg py-3 text-sm font-medium hover:bg-terra-fosc transition-colors"
        >
          Iniciar activitat
        </button>

        {mostrantAvis && (
          <div className="fixed inset-0 bg-black/60 z-[2000] flex items-center justify-center p-4">
            <div className="bg-superficie rounded-card max-w-sm w-full p-6">
              <h3 className="text-base font-semibold text-text-principal mb-3">
                Abans de començar
              </h3>
              <ul className="text-sm text-text-principal flex flex-col gap-2 mb-5 list-disc pl-5">
                <li>Això no és una competició: vas al teu ritme i sota la teva responsabilitat.</li>
                <li>No controlem l&apos;estat del terreny ni dels tags. Vés equipat i amb seny.</li>
                <li>Respecta el medi: no deixis brossa i no surtis dels camins marcats.</li>
              </ul>
              <p className="text-xs text-text-secundari mb-4">
                Consulta les{" "}
                <a href="/termes" target="_blank" className="text-pi font-medium hover:underline">
                  condicions d&apos;ús
                </a>{" "}
                completes en qualsevol moment.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setMostrantAvis(false);
                    if (!bidireccional) {
                      // No bidireccional: iniciem directament en anada
                      const nova = crearActivitatAmbSentit("anada", "manual");
                      desarActivitat(nova);
                      setActivitat(nova);
                    } else {
                      // Bidireccional: esperem el primer tag
                      setIniciada(true);
                    }
                  }}
                  className="flex-1 bg-terra text-white rounded-lg py-2.5 text-sm font-medium hover:bg-terra-fosc transition-colors"
                >
                  Entesos, comencem
                </button>
                <button
                  onClick={() => setMostrantAvis(false)}
                  className="text-sm text-text-secundari px-3 hover:text-text-principal transition-colors"
                >
                  Cancel·lar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ---- RENDER: esperant primer tag (bidireccional) ----
  if (!activitat && iniciada && bidireccional) {
    return (
      <div className="flex flex-col gap-4">
        {missatge && (
          <div className={`text-sm px-4 py-3 rounded-lg ${missatge.tipus === "ok" ? "bg-exit-clar text-exit-fosc" : "bg-alerta-clar text-alerta"}`}>
            {missatge.text}
          </div>
        )}
        <div className="bg-superficie border border-pi rounded-card p-5">
          <p className="text-sm font-medium text-text-principal mb-1">
            Llegeix el primer tag
          </p>
          <p className="text-xs text-text-secundari mb-4">
            Detectarem el sentit automàticament segons quin tag sigui.
          </p>
          <BotonsDeteccio />
          <div className="mt-4 pt-3 border-t border-vora">
            <p className="text-xs text-text-secundari mb-2">O tria el sentit manualment:</p>
            <div className="flex gap-2">
              <button
                onClick={() => iniciarAmbSentitManual("anada")}
                className="flex-1 border border-pi text-pi text-xs font-medium py-2 rounded-lg hover:bg-pi-clar transition-colors"
              >
                Anada
              </button>
              <button
                onClick={() => iniciarAmbSentitManual("tornada")}
                className="flex-1 border border-cel text-cel text-xs font-medium py-2 rounded-lg hover:bg-cel-clar transition-colors"
              >
                Tornada
              </button>
            </div>
          </div>
        </div>
        <button
          onClick={abandonar}
          className="w-full bg-superficie border border-alerta text-alerta rounded-lg py-2.5 text-sm font-medium hover:bg-alerta-clar transition-colors"
        >
          Abandonar
        </button>
      </div>
    );
  }

  // ---- RENDER: activitat en curs ----
  const esperat = activitat ? seguentCheckpointEsperat(activitat) : null;
  const completada = activitat ? activitatCompletada(activitat) : false;
  const sentitPendent = activitat?.sentit === "pendent";

  const checkpointsOrdenatsPerActivitat = activitat
    ? activitat.checkpointsEsperat.map((ce) =>
        checkpoints.find((c) => c.checkpointId === ce.checkpointId)!
      ).filter(Boolean)
    : [];

  return (
    <div className="flex flex-col gap-4">
      {missatge && (
        <div className={`text-sm px-4 py-3 rounded-lg ${missatge.tipus === "ok" ? "bg-exit-clar text-exit-fosc" : "bg-alerta-clar text-alerta"}`}>
          {missatge.text}
        </div>
      )}

      {/* Temps total */}
      <div className="bg-superficie border border-vora rounded-card p-5 text-center">
        <p className="text-xs text-text-secundari uppercase tracking-wide mb-1">
          {completada
            ? "Activitat completada"
            : sentitPendent
            ? "Llegeix el segon tag per confirmar el sentit"
            : activitat?.iniciadaEl
            ? `En curs · ${activitat.sentit === "tornada" ? "tornada" : "anada"}`
            : "Esperant el primer punt de control"}
        </p>
        <p className="text-2xl font-medium text-text-principal font-mono">
          {activitat?.iniciadaEl ? formatDuracio(activitat.iniciadaEl) : "00:00:00"}
        </p>
      </div>

      {/* Accio de deteccio */}
      {!completada && (esperat || sentitPendent) && (() => {
        const infoCheckpointActual = esperat
          ? checkpoints.find((c) => c.checkpointId === esperat.checkpointId)
          : undefined;
        const numReports = infoCheckpointActual?.numReportsPendents ?? 0;

        return (
          <div className="bg-superficie border border-pi rounded-card p-5">
            <p className="text-xs text-text-secundari mb-1">
              {sentitPendent ? "Segon punt de control" : "Següent punt de control esperat"}
            </p>
            {infoCheckpointActual && (
              <p className="text-sm font-medium text-text-principal mb-3">
                {infoCheckpointActual.nom}
              </p>
            )}
            {numReports >= llindarReports && (
              <div className="bg-alerta-clar text-alerta text-xs px-3 py-2 rounded-lg mb-3">
                Diversos usuaris han avisat que aquest punt pot tenir problemes.
              </div>
            )}
            <BotonsDeteccio checkpointInfo={infoCheckpointActual} />
            {esperat && (
              <div className="mt-2">
                <AvisarTagButton checkpointId={esperat.checkpointId} />
              </div>
            )}
          </div>
        );
      })()}

      {/* Progres */}
      <div className="bg-superficie border border-vora rounded-card p-5">
        <p className="text-xs font-medium text-text-secundari uppercase tracking-wide mb-3">
          Progrés {sentitPendent && <span className="text-terra">(sentit pendent)</span>}
        </p>
        <div className="flex flex-col gap-2">
          {checkpointsOrdenatsPerActivitat.map((cp, idx) => {
            const fet = activitat?.passos.find((p) => p.checkpointId === cp?.checkpointId);
            if (!cp) return null;
            return (
              <div key={cp.checkpointId} className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${fet ? "bg-exit text-white" : "bg-fons border border-vora text-text-secundari"}`}>
                  {fet ? "✓" : idx + 1}
                </span>
                <span className="text-sm text-text-principal">
                  {cp.nom}
                  {cp.esInici && <span className="text-xs text-pi ml-2">(Inici)</span>}
                  {cp.esFi && <span className="text-xs text-terra ml-2">(Fi)</span>}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Accions */}
      {completada ? (
        <button
          onClick={sincronitzar}
          disabled={sincronitzant}
          className="w-full bg-terra text-white rounded-lg py-3 text-sm font-medium hover:bg-terra-fosc transition-colors disabled:opacity-50"
        >
          {sincronitzant ? "Sincronitzant..." : "Finalitzar i desar activitat"}
        </button>
      ) : (
        <button
          onClick={abandonar}
          className="w-full bg-superficie border border-alerta text-alerta rounded-lg py-2.5 text-sm font-medium hover:bg-alerta-clar transition-colors"
        >
          Abandonar activitat
        </button>
      )}
    </div>
  );
}

function formatDuracio(iniciadaEl: string): string {
  const inici = new Date(iniciadaEl).getTime();
  const ara = Date.now();
  const segons = Math.floor((ara - inici) / 1000);
  const h = Math.floor(segons / 3600);
  const m = Math.floor((segons % 3600) / 60);
  const s = segons % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}
