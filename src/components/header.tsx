import { auth } from "@/lib/auth";
import Link from "next/link";
import Image from "next/image";
import SignOutButton from "./sign-out-button";
import NavLinks from "./nav-links";import { auth } from "@/lib/auth";
import Link from "next/link";
import Image from "next/image";
import SignOutButton from "./sign-out-button";
import NavLinks from "./nav-links";

export default async function Header() {
  const session = await auth();
  const isAdmin = (session?.user as any)?.rol === "administrador";

  return (
    <header className="bg-superficie border-b border-vora overflow-x-hidden">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
        <Link href="/" className="text-base font-semibold text-text-principal flex items-center gap-2 shrink-0">
          <Image src="/images/logo.png" alt="Fita" width={28} height={28} className="shrink-0" />
          <span>Fita</span>
        </Link>
        <nav className="flex items-center gap-0.5 ml-auto overflow-x-auto min-w-0">
          <NavLinks isAdmin={isAdmin} isLoggedIn={!!session?.user} />
          {session?.user ? (
            <SignOutButton />
          ) : (
            <Link href="/auth/login" className="text-sm text-pi font-medium hover:underline px-2.5 py-1 shrink-0 whitespace-nowrap">
              Inicia sessió
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

export default async function Header() {
  const session = await auth();
  const isAdmin = (session?.user as any)?.rol === "administrador";

  return (
    <header className="bg-superficie border-b border-vora">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-6">
        <Link href="/" className="text-base font-semibold text-text-principal flex items-center gap-2 shrink-0">
          <Image src="/images/logo.png" alt="Fita" width={28} height={28} className="shrink-0" />
          <span>Fita</span>
        </Link>

        <nav className="flex items-center gap-1 ml-auto">
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
