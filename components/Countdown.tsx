"use client";

import { useEffect, useState } from "react";

/** Live ticking countdown to race day (local midnight of raceDate). */
export function Countdown({ raceDate }: { raceDate: string }) {
  const target = (() => {
    const [y, m, d] = raceDate.split("T")[0].split("-").map(Number);
    return new Date(y, m - 1, d, 7, 0, 0).getTime(); // assume ~7am gun time
  })();

  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Avoid hydration mismatch: render a stable placeholder until mounted.
  const diff = now === null ? null : Math.max(0, target - now);

  const parts =
    diff === null
      ? null
      : {
          d: Math.floor(diff / 86_400_000),
          h: Math.floor((diff % 86_400_000) / 3_600_000),
          m: Math.floor((diff % 3_600_000) / 60_000),
          s: Math.floor((diff % 60_000) / 1000),
        };

  const cells: [string, number | null][] = [
    ["days", parts?.d ?? null],
    ["hrs", parts?.h ?? null],
    ["min", parts?.m ?? null],
    ["sec", parts?.s ?? null],
  ];

  return (
    <div className="flex items-end gap-2 sm:gap-3 tabular">
      {cells.map(([label, val], i) => (
        <div key={label} className="flex items-end">
          <div className="text-center">
            <div className="font-display text-4xl sm:text-5xl leading-none">
              {val === null ? "—" : val.toString().padStart(2, "0")}
            </div>
            <div className="eyebrow mt-1.5 !text-[0.58rem]">{label}</div>
          </div>
          {i < cells.length - 1 && (
            <span className="font-display text-3xl sm:text-4xl text-muted px-1 sm:px-1.5 -translate-y-1.5">
              :
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
