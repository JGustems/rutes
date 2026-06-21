import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import Header from "@/components/header";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: "Fita",
  description: "Cronometra't a tu mateix en rutes de muntanya, amb tags NFC i Bluetooth",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ca" className={montserrat.variable}>
      <body className="bg-fons text-text-principal min-h-screen font-sans">
        <Header />
        {children}
      </body>
    </html>
  );
}
