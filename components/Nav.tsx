"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Board" },
  { href: "/sessions", label: "Sessions" },
  { href: "/bets", label: "Place a bet" },
  { href: "/settle", label: "Settle" },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-ink/80 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-5 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="checker h-5 w-5 rounded-[3px] opacity-90 group-hover:rotate-12 transition-transform" />
          <span className="font-display text-2xl tracking-tight">
            Pace<span className="text-volt text-glow-volt">Bet</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          {LINKS.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`font-mono text-[0.7rem] uppercase tracking-[0.14em] px-3 py-2 rounded-lg transition-colors ${
                  active
                    ? "text-ink bg-volt"
                    : "text-muted hover:text-bone hover:bg-ink-3"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
