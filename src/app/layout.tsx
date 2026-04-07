import type { Metadata } from "next";
import { Montserrat, Syncopate } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

const syncopate = Syncopate({
  weight: ["400", "700"],
  variable: "--font-handel-fallback",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "O11y SkillFlow",
  description: "Plataforma integral de simulación y calibración de talento Prime Ops",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${montserrat.variable} ${syncopate.variable} antialiased font-sans`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
