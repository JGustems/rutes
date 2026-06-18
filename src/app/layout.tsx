import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rutes Muntanya",
  description: "Cronometratge de rutes de muntanya amb tags NFC i Bluetooth",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ca">
      <body className="bg-fons text-text-principal min-h-screen">
        {children}
      </body>
    </html>
  );
}
