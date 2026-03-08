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
  title: "OTP: Observability Talent Pivot",
  description: "Plataforma de evaluación SRE/DevOps",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${montserrat.variable} ${syncopate.variable} antialiased font-sans`}
      >
        {children}
      </body>
    </html>
  );
}
