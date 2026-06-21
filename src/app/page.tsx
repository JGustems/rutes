import Link from "next/link";
import Image from "next/image";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-fons">

      
     {/* Capcalera amb foto real de muntanya */}
      <div className="relative px-4 py-20 text-center overflow-hidden">
        <Image
          src="/images/hero-banner.jpg"
          alt="Estany de muntanya al Pirineu"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/45" />

        <div className="relative z-10">
          <h1 className="text-3xl font-semibold text-white mb-3">
            Fita
          </h1>
          <p className="text-base text-white/90 max-w-md mx-auto leading-relaxed">
            Cronometra&apos;t a tu mateix en rutes de muntanya, carretera i BTT,
            al teu ritme i quan vulguis.
          </p>
          <Link
            href="/rutes"
            className="inline-block mt-6 bg-white text-pi-fosc font-medium text-sm px-6 py-3 rounded-lg hover:bg-fons transition-colors"
          >
            Veure les rutes disponibles
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-12">

        {/* Com funciona */}
        <h2 className="text-lg font-medium text-text-principal mb-6 text-center">
          Com funciona
        </h2>

        <div className="flex flex-col gap-4 mb-12">
          <div className="bg-superficie border border-vora rounded-card p-5 flex gap-4 items-start">
            <span className="bg-pi-clar text-pi-fosc w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium shrink-0">
              1
            </span>
            <div>
              <p className="text-sm font-medium text-text-principal mb-1">
                Tria una ruta
              </p>
              <p className="text-sm text-text-secundari">
                Explora les rutes disponibles per categoria: trail running,
                km vertical, BTT, carretera i més.
              </p>
            </div>
          </div>

          <div className="bg-superficie border border-vora rounded-card p-5 flex gap-4 items-start">
            <span className="bg-cel-clar text-cel-fosc w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium shrink-0">
              2
            </span>
            <div>
              <p className="text-sm font-medium text-text-principal mb-1">
                Inicia l&apos;activitat
              </p>
              <p className="text-sm text-text-secundari">
                A mesura que vas passant pels punts de control de la ruta,
                el mòbil detecta automàticament els tags NFC o Bluetooth
                instal·lats al terreny.
              </p>
            </div>
          </div>

          <div className="bg-superficie border border-vora rounded-card p-5 flex gap-4 items-start">
            <span className="bg-terra-clar text-terra-fosc w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium shrink-0">
              3
            </span>
            <div>
              <p className="text-sm font-medium text-text-principal mb-1">
                Completa i compara
              </p>
              <p className="text-sm text-text-secundari">
                Al finalitzar, el teu temps queda registrat. Consulta el teu
                historial, les teves estadístiques, i veuràs com et situes
                al rànquing de cada ruta.
              </p>
            </div>
          </div>
        </div>

        {/* Nota important */}
        <div className="bg-superficie border border-vora rounded-card p-5 mb-12">
          <p className="text-sm text-text-principal">
            <strong>Això no és una competició organitzada.</strong> Fas les
            rutes quan vulguis, al teu ritme, sota la teva responsabilitat.
            Consulta les{" "}
            <Link href="/termes" className="text-pi font-medium hover:underline">
              condicions d&apos;ús
            </Link>{" "}
            abans de començar.
          </p>
        </div>

        <Link
          href="/rutes"
          className="w-full bg-terra text-white text-center rounded-lg py-3 text-sm font-medium hover:bg-terra-fosc transition-colors block"
        >
          Explorar rutes
        </Link>

      </div>
    </main>
  );
}
