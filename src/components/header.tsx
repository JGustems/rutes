import { auth } from "@/lib/auth";
import Link from "next/link";
import SignOutButton from "./sign-out-button";
import NavLinks from "./nav-links";

export default async function Header() {
  const session = await auth();
  const isAdmin = (session?.user as any)?.rol === "administrador";

  return (
    <header className="bg-superficie border-b border-vora">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
        <Link href="/" className="text-base font-medium text-text-principal flex items-center gap-1.5 shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-pi shrink-0">
            <path d="M3 20L9 8L12 14L15 9L21 20H3Z" fill="currentColor" />
          </svg>
          <span className="hidden sm:inline">Rutes Muntanya</span>
        </Link>

        <nav className="flex items-center gap-0 ml-auto">
          <NavLinks isAdmin={isAdmin} isLoggedIn={!!session?.user} />
          {session?.user ? (
            <SignOutButton />
          ) : (
            <Link href="/auth/login" className="text-sm text-pi font-medium hover:underline px-2.5 py-1">
              Inicia sessió
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
