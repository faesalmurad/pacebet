import type { Metadata } from "next";
import { Anton, Hanken_Grotesk, DM_Mono } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/Nav";

const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
});

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken",
});

const dmMono = DM_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-dm-mono",
});

export const metadata: Metadata = {
  title: "PaceBet — the line on the marathon",
  description:
    "A friendly wager board: bet over/under on the marathon finish time and watch training progress roll in.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${anton.variable} ${hanken.variable} ${dmMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Nav />
        <main className="flex-1">{children}</main>
        <footer className="mt-20 border-t border-line">
          <div className="mx-auto max-w-6xl px-5 py-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="eyebrow">PaceBet · friendly wagers, no bookie</p>
            <p className="text-xs text-muted">
              Training data is mock for now — Strava-ready when you are.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
