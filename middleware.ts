import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  const rutesPrivades = ["/perfil", "/activitat", "/historial"];
  const rutesAdmin = ["/admin"];

  const esPrivada = rutesPrivades.some((r) => pathname.startsWith(r));
  const esAdmin = rutesAdmin.some((r) => pathname.startsWith(r));

  if ((esPrivada || esAdmin) && !session) {
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (esAdmin && session?.user && (session.user as any).rol !== "administrador") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth).*)",
  ],
};
