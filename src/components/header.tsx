import { auth } from "@/lib/auth";
import Link from "next/link";
import SignOutButton from "./sign-out-button";

export default async function Header() {
  const session = await auth();
  const isAdmin = (session?.user as any)?.rol === "administrador";

  return (
    <header className="bg-superficie border-b border-vora">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-base font-medium text-text-principal">
          Rutes Muntanya
        </Link>

        <nav className="flex items-center gap-4">
          <Link
            href="/rutes"
            className="text-sm text-text-secundari hover:text-text-principal transition-colors"
          >
            Rutes
          </Link>
          {session?.user ? (
            <>
              {isAdmin && (
                <Link href="/admin" className="text-sm text-terra font-medium hover:underline">
                  Admin
                </Link>
              )}
              <Link href="/historial" className="text-sm text-text-secundari hover:text-text-principal transition-colors">
                Historial
              </Link>
              <Link href="/perfil" className="text-sm text-text-secundari hover:text-text-principal transition-colors">
                Perfil
              </Link>
              <SignOutButton />
            </>
          ) : (
            <Link href="/auth/login" className="text-sm text-pi font-medium hover:underline">
              Inicia sessió
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
