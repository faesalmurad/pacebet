import type { BetTally } from "@/lib/stats";

export function BetSplitBar({ tally }: { tally: BetTally }) {
  const total = tally.under.count + tally.over.count;
  // Width by stake when there's money down, else by head count.
  const basisUnder = tally.totalPot > 0 ? tally.under.stake : tally.under.count;
  const basisOver = tally.totalPot > 0 ? tally.over.stake : tally.over.count;
  const denom = basisUnder + basisOver;
  const underPct = denom > 0 ? (basisUnder / denom) * 100 : 50;

  return (
    <div className="panel p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <p className="eyebrow">The book</p>
        <p className="font-mono text-xs text-muted">
          {total} {total === 1 ? "bet" : "bets"} ·{" "}
          <span className="text-bone">${tally.totalPot.toLocaleString()}</span> pot
        </p>
      </div>

      <div className="mt-5 flex items-end justify-between gap-4">
        <div>
          <p className="font-display text-4xl text-volt text-glow-volt tabular">
            {tally.under.count}
          </p>
          <p className="eyebrow mt-1 text-volt">Under ${tally.under.stake.toLocaleString()}</p>
        </div>
        <div className="text-right">
          <p className="font-display text-4xl text-coral text-glow-coral tabular">
            {tally.over.count}
          </p>
          <p className="eyebrow mt-1 text-coral">Over ${tally.over.stake.toLocaleString()}</p>
        </div>
      </div>

      <div className="mt-4 h-3 w-full rounded-full overflow-hidden flex bg-ink-3 border border-line">
        <div
          className="h-full bg-volt transition-all"
          style={{ width: `${underPct}%` }}
        />
        <div
          className="h-full bg-coral transition-all"
          style={{ width: `${100 - underPct}%` }}
        />
      </div>
      <p className="mt-2 font-mono text-[0.62rem] uppercase tracking-widest text-muted">
        {underPct.toFixed(0)}% backing under · {(100 - underPct).toFixed(0)}% backing over
      </p>
    </div>
  );
}
