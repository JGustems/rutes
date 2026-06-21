import { auth } from "@/lib/auth";
import Link from "next/link";
import Image from "next/image";
import SignOutButton from "./sign-out-button";
import NavLinks from "./nav-links";

export default async function Header() {
  const session = await auth();
  const isAdmin = (session?.user as any)?.rol === "administrador";

  return (
    <header className="bg-superficie border-b border-vora overflow-x-hidden">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-2">
        <Link href="/" className="flex items-center shrink-0">
          <Image src="/images/logo.png" alt="Fita" width={32} height={32} className="shrink-0" />
        </Link>
        <nav className="flex items-center gap-0.5 ml-auto min-w-0">
          <NavLinks isAdmin={isAdmin} isLoggedIn={!!session?.user} />
          {session?.user ? (
            <SignOutButton />
          ) : (
            <Link href="/auth/login" className="text-xs sm:text-sm text-pi font-medium hover:underline px-1.5 sm:px-2.5 py-1 shrink-0 whitespace-nowrap">
              Inicia sessió
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
