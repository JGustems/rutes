"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="text-sm text-text-secundari hover:text-alerta transition-colors"
    >
      Tancar sessió
    </button>
  );
}
