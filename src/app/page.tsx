import Link from "next/link";
import Image from "next/image";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-fons">

      {/* Capcalera amb foto real de muntanya */}
      <div className="relative px-4 py-20 text-center overflow-hidden">
        <Image
          src="/images/hero-muntanya.jpg"
          alt="Estany de muntanya al Pirineu"
          fill
          priority
          className="object-cover -z-10"
        />
        <div className="absolute inset-0 bg-black/45 -z-10" />

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
