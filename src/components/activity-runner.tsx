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

export default function ActivityRunner({
  routeId,
  routeNom,
  checkpoints,
  llindarReports,
}: {
  routeId: string;
  routeNom: string;
  checkpoints: CheckpointInfo[];
  llindarReports: number;
}) {
  const router = useRouter();
  const [activitat, setActivitat] = useState<ActivitatLocal | null>(null);
  const [codiManual, setCodiManual] = useState("");
  const [missatge, setMissatge] = useState<{ tipus: "ok" | "error"; text: string } | null>(null);
  const [nfcDisponible, setNfcDisponible] = useState(false);
  const [bleConnectant, setBleConnectant] = useState(false);
  const [sincronitzant, setSincronitzant] = useState(false);
  const [mostrantAvis, setMostrantAvis] = useState(false);

  // Carregar activitat existent del localStorage en muntar
  useEffect(() => {
    const existent = obtenirActivitat();
    if (existent && existent.routeId === routeId) {
      setActivitat(existent);
    }
    setNfcDisponible(typeof window !== "undefined" && "NDEFReader" in window);
  }, [routeId]);

  // Forçar un rerenderitzat cada segon mentre hi hagi una
  // activitat en curs, per actualitzar el cronometre en directe
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

  function registrarPas(codiDetectatRaw: string, font: "nfc" | "ble" | "manual") {
    const codiDetectat = normalitzarCodi(codiDetectatRaw);

    setActivitat((actual) => {
      if (!actual) return actual;

      const esperat = seguentCheckpointEsperat(actual);
      if (!esperat) {
        mostrarMissatge("error", "Ja s'han completat tots els punts de control");
        return actual;
      }

      if (normalitzarCodi(esperat.tagCodi ?? "") !== codiDetectat) {
        mostrarMissatge(
          "error",
          "Aquest codi no correspon al següent punt de control esperat"
        );
        return actual;
      }

      const araIso = new Date().toISOString();
      const esPrimerPas = actual.passos.length === 0;

      const nouPas = {
        checkpointId: esperat.checkpointId,
        detectatEl: araIso,
        font,
      };

      const actualitzada: ActivitatLocal = {
        ...actual,
        // El cronometre comença a comptar al primer pas, no al
        // moment de prementar "Iniciar activitat"
        iniciadaEl: esPrimerPas ? araIso : actual.iniciadaEl,
        passos: [...actual.passos, nouPas],
      };

      desarActivitat(actualitzada);
      mostrarMissatge("ok", "Punt de control validat!");
      return actualitzada;
    });
  }

  function iniciar(font: "nfc" | "ble" | "manual") {
    const checkpointsEsperat = checkpoints
      .sort((a, b) => a.ordre - b.ordre)
      .map((c) => ({ checkpointId: c.checkpointId, ordre: c.ordre, tagCodi: c.tagCodi }));

    const nova: ActivitatLocal = {
      localId:
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : String(Date.now()),
      routeId,
      sentit: "anada",
      iniciadaEl: null,
      fontInici: font,
      passos: [],
      checkpointsEsperat,
    };

    desarActivitat(nova);
    setActivitat(nova);
  }

  function abandonar() {
    if (!confirm("Segur que vols abandonar aquesta activitat? Es perdrà el progrés.")) return;
    esborrarActivitat();
    setActivitat(null);
  }

  // --------------------------------------------------------
  // NFC
  // --------------------------------------------------------
  async function escoltarNFC() {
    if (!nfcDisponible) {
      mostrarMissatge("error", "Aquest dispositiu o navegador no suporta NFC");
      return;
    }
    try {
      // @ts-ignore - Web NFC API no te tipus oficials encara
      const reader = new (window as any).NDEFReader();
      await reader.scan();
      mostrarMissatge("ok", "Escoltant NFC... acosta el mòbil al tag");
      reader.onreading = (event: any) => {
        const serialNumber = event.serialNumber as string;
        registrarPas(serialNumber, "nfc");
      };
    } catch (err) {
      mostrarMissatge("error", "No s'ha pogut activar el lector NFC");
    }
  }

  // --------------------------------------------------------
  // BLE
  // --------------------------------------------------------
  async function connectarBLE() {
    if (typeof navigator === "undefined" || !("bluetooth" in navigator)) {
      mostrarMissatge("error", "Aquest dispositiu o navegador no suporta Bluetooth");
      return;
    }
    setBleConnectant(true);
    try {
      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
      });
      // L'identificador exposat pel navegador (pot variar segons el
      // dispositiu; en molts casos cal fer servir el nom anunciat)
      const codi = device.name || device.id;
      registrarPas(codi, "ble");
    } catch (err) {
      mostrarMissatge("error", "No s'ha trobat o connectat cap dispositiu Bluetooth");
    } finally {
      setBleConnectant(false);
    }
  }

  // --------------------------------------------------------
  // Manual
  // --------------------------------------------------------
  function enviarCodiManual() {
    if (!codiManual.trim()) return;
    registrarPas(codiManual.trim(), "manual");
    setCodiManual("");
  }

  // --------------------------------------------------------
  // Sincronitzar amb el servidor
  // --------------------------------------------------------
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

  // --------------------------------------------------------
  // Render
  // --------------------------------------------------------

  if (!activitat) {
    return (
      <div className="bg-superficie border border-vora rounded-card p-6 text-center">
        <p className="text-sm text-text-secundari mb-4">
          Preparat per començar la ruta &quot;{routeNom}&quot;?
        </p>
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
                    iniciar("manual");
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

  const esperat = seguentCheckpointEsperat(activitat);
  const completada = activitatCompletada(activitat);
  const checkpointsOrdenats = [...checkpoints].sort((a, b) => a.ordre - b.ordre);

  return (
    <div className="flex flex-col gap-4">

      {missatge && (
        <div
          className={`text-sm px-4 py-3 rounded-lg ${
            missatge.tipus === "ok"
              ? "bg-exit-clar text-exit-fosc"
              : "bg-alerta-clar text-alerta"
          }`}
        >
          {missatge.text}
        </div>
      )}

      {/* Temps total */}
      <div className="bg-superficie border border-vora rounded-card p-5 text-center">
        <p className="text-xs text-text-secundari uppercase tracking-wide mb-1">
          {completada
            ? "Activitat completada"
            : activitat.iniciadaEl
            ? "En curs"
            : "Esperant el primer punt de control"}
        </p>
        <p className="text-2xl font-medium text-text-principal font-mono">
          {activitat.iniciadaEl ? formatDuracio(activitat.iniciadaEl) : "00:00:00"}
        </p>
      </div>

      {/* Acció de deteccio (nomes si no esta completada) */}
      {!completada && esperat && (() => {
        const infoCheckpointActual = checkpoints.find((c) => c.checkpointId === esperat.checkpointId);
        const numReports = infoCheckpointActual?.numReportsPendents ?? 0;

        return (
        <div className="bg-superficie border border-pi rounded-card p-5">
          <p className="text-xs text-text-secundari mb-1">
            Següent punt de control esperat
          </p>
          <p className="text-sm font-medium text-text-principal mb-3">
            {infoCheckpointActual?.nom ?? ""}
          </p>

          {numReports >= llindarReports && (
            <div className="bg-alerta-clar text-alerta text-xs px-3 py-2 rounded-lg mb-3">
              Diversos usuaris han avisat que aquest punt pot tenir problemes.
              Si no detectes el tag, prova el codi manual o el QR, i si tampoc
              funciona, avisa&apos;ns amb el botó de sota.
            </div>
          )}

          <div className="flex flex-col gap-3">
            {infoCheckpointActual?.tagTipus === "nfc" && (
              <button
                onClick={escoltarNFC}
                disabled={!nfcDisponible}
                className="w-full bg-pi text-white rounded-lg py-2.5 text-sm font-medium hover:bg-pi-fosc transition-colors disabled:opacity-40"
              >
                {nfcDisponible ? "Escoltar NFC" : "NFC no disponible en aquest navegador"}
              </button>
            )}

            <div className="flex gap-2">
              {infoCheckpointActual?.tagTipus === "ble" && (
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

            <AvisarTagButton checkpointId={esperat.checkpointId} />
          </div>
        </div>
        );
      })()}

      {/* Progres */}
      <div className="bg-superficie border border-vora rounded-card p-5">
        <p className="text-xs font-medium text-text-secundari uppercase tracking-wide mb-3">
          Progrés
        </p>
        <div className="flex flex-col gap-2">
          {checkpointsOrdenats.map((cp) => {
            const fet = activitat.passos.find((p) => p.checkpointId === cp.checkpointId);
            return (
              <div key={cp.checkpointId} className="flex items-center gap-3">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${
                    fet ? "bg-exit text-white" : "bg-fons border border-vora text-text-secundari"
                  }`}
                >
                  {fet ? "✓" : cp.ordre}
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
