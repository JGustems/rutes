"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function NavLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  const pathname = usePathname();
  const actiu = pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <Link
      href={href}
      className={`text-sm px-2.5 py-1 rounded-lg transition-colors ${
        actiu
          ? "bg-pi-clar text-pi-fosc font-medium"
          : `text-text-secundari hover:text-text-principal ${className ?? ""}`
      }`}
    >
      {children}
    </Link>
  );
}

export default function NavLinks({ isAdmin, isLoggedIn }: { isAdmin: boolean; isLoggedIn: boolean }) {
  return (
    <>
      <NavLink href="/rutes">Rutes</NavLink>
      {isLoggedIn && (
        <>
          {isAdmin && (
            <NavLink href="/admin" className="!text-terra font-medium">
              Admin
            </NavLink>
          )}
          <NavLink href="/historial">Historial</NavLink>
          <NavLink href="/perfil">Perfil</NavLink>
        </>
      )}
    </>
  );
}
