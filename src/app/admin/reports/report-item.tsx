"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Report = {
  id: string;
  motiu: string | null;
  creat_el: string;
  checkpoint_nom: string;
  ruta_nom: string | null;
  ruta_id: string | null;
  usuari_nom: string | null;
};

export default function ReportItem({ report }: { report: Report }) {
  const router = useRouter();
  const [carregant, setCarregant] = useState(false);

  async function handleResoldre() {
    setCarregant(true);
    await fetch(`/api/admin/tag-reports/${report.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estat: "resolt" }),
    });
    setCarregant(false);
    router.refresh();
  }

  return (
    <div className="bg-superficie border border-alerta/40 rounded-card px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-text-principal">
            {report.checkpoint_nom}
          </p>
          {report.ruta_nom && report.ruta_id && (
            <Link
              href={`/admin/rutes/${report.ruta_id}/checkpoints`}
              className="text-xs text-pi hover:underline"
            >
              {report.ruta_nom}
            </Link>
          )}
          {report.motiu && (
            <p className="text-xs text-text-principal mt-1">{report.motiu}</p>
          )}
          <p className="text-xs text-text-secundari mt-1">
            {report.usuari_nom ? `Avisat per ${report.usuari_nom}` : "Avisat sense identificar-se"}
            {" · "}
            {new Date(report.creat_el).toLocaleDateString("ca-ES", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <button
          onClick={handleResoldre}
          disabled={carregant}
          className="text-xs bg-exit text-white font-medium px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0"
        >
          {carregant ? "..." : "Marcar resolt"}
        </button>
      </div>
    </div>
  );
}
