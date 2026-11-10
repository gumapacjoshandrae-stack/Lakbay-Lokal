import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lakbay Lokal — A Central Visayas field guide",
  description: "A slow-travel pocket guide to Cebu, Bohol, and nearby islands in Central Visayas.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
