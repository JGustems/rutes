import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();

  return (
    <main className="min-h-screen bg-fons p-6">
      <h1 className="text-xl font-medium mb-4">Debug sessió</h1>
      <pre className="bg-white border border-vora rounded-card p-4 text-xs overflow-auto">
        {JSON.stringify(session, null, 2)}
      </pre>
    </main>
  );
}
