export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-medium text-text-principal mb-2">
        Rutes Muntanya
      </h1>
      <p className="text-text-secundari mb-6">
        Esquelet inicial funcionant correctament.
      </p>
      <div className="flex gap-3">
        <span className="bg-pi text-white text-sm px-4 py-2 rounded-card">
          Verd pi
        </span>
        <span className="bg-cel text-white text-sm px-4 py-2 rounded-card">
          Blau ser&egrave;
        </span>
        <span className="bg-terra text-white text-sm px-4 py-2 rounded-card">
          Terracota
        </span>
      </div>
    </main>
  );
}
