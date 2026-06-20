"use client";

import { useEffect, useRef, useState } from "react";

export default function QrScannerButton({
  onScan,
}: {
  onScan: (codi: string) => void;
}) {
  const [obert, setObert] = useState(false);
  const [error, setError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<any>(null);

  useEffect(() => {
    if (!obert || !videoRef.current) return;

    let actiu = true;

    (async () => {
      try {
        const QrScanner = (await import("qr-scanner")).default;
        (QrScanner as any).WORKER_PATH = "/qr-scanner-worker.min.js";

        if (!actiu || !videoRef.current) return;

        const scanner = new QrScanner(
          videoRef.current,
          (result: any) => {
            const text = typeof result === "string" ? result : result.data;
            onScan(text);
            tancar();
          },
          { highlightScanRegion: true, highlightCodeOutline: true }
        );

        scannerRef.current = scanner;
        await scanner.start();
      } catch (err) {
        setError("No s'ha pogut accedir a la càmera");
      }
    })();

    return () => {
      actiu = false;
      scannerRef.current?.destroy();
      scannerRef.current = null;
    };
  }, [obert]);

  function tancar() {
    scannerRef.current?.destroy();
    scannerRef.current = null;
    setObert(false);
    setError("");
  }

  return (
    <>
      <button onClick={() => setObert(true)} className="bg-cel text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-cel-fosc transition-colors">
        Escanejar QR
      </button>

      {obert && (
        <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-sm bg-superficie rounded-card overflow-hidden">
            <video ref={videoRef} className="w-full aspect-square object-cover" />
            <div className="p-4">
              {error && <p className="text-sm text-alerta mb-3">{error}</p>}
              <button onClick={tancar} className="w-full bg-fons border border-vora text-text-principal rounded-lg py-2 text-sm font-medium hover:bg-vora transition-colors">
                Cancel·lar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
