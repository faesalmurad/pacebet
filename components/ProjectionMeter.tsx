import { formatDuration, formatShortDate } from "@/lib/format";

interface Props {
  lineSeconds: number;
  projectedSeconds: number | null;
  side: "over" | "under" | null;
  marginSeconds: number;
  basisMiles: number;
  predictorName?: string;
  predictorDate?: string;
}

export function ProjectionMeter({
  lineSeconds,
  projectedSeconds,
  side,
  marginSeconds,
  basisMiles,
  predictorName,
  predictorDate,
}: Props) {
  // Map a ±20min window around the line onto the track.
  const windowSec = 20 * 60;
  const pos =
    projectedSeconds === null
      ? 50
      : Math.min(96, Math.max(4, 50 - (marginSeconds / windowSec) * 50));

  const under = side === "under";
  const accent = under ? "text-volt" : "text-coral";
  const absMargin = Math.abs(marginSeconds);

  return (
    <div className="panel p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <p className="eyebrow">Projected finish · Riegel model</p>
        <p className="eyebrow !tracking-[0.12em]">
          from {basisMiles.toFixed(1)} mi long run
        </p>
      </div>

      {projectedSeconds === null ? (
        <p className="mt-6 text-muted text-sm">
          Not enough training data yet to project a finish.
        </p>
      ) : (
        <>
          {predictorName && predictorDate && (
            <div className="mt-4 text-xs text-muted">
              <p className="font-mono">
                from {predictorName} · {formatShortDate(predictorDate)}
              </p>
            </div>
          )}
          <div className="mt-4 flex items-baseline gap-3">
            <span
              className={`font-display text-5xl sm:text-6xl tabular ${accent} ${
                under ? "text-glow-volt" : "text-glow-coral"
              }`}
            >
              {formatDuration(projectedSeconds)}
            </span>
            <span
              className={`font-mono text-xs uppercase tracking-widest px-2 py-1 rounded ${
                under ? "bg-volt text-ink" : "bg-coral text-ink"
              }`}
            >
              {under ? "Under" : "Over"} by {formatDuration(absMargin)}
            </span>
          </div>

          {/* The track */}
          <div className="mt-7 relative h-12">
            {/* lane */}
            <div className="lane-lines absolute inset-x-0 top-1/2 h-3 -translate-y-1/2 rounded-full bg-ink-3 border border-line" />
            {/* the line marker (center) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
              <div className="checker h-7 w-2.5 rounded-[2px]" />
            </div>
            {/* projected marker */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all"
              style={{ left: `${pos}%` }}
            >
              <div
                className={`h-5 w-5 rounded-full ${
                  under ? "bg-volt glow-volt" : "bg-coral glow-coral"
                }`}
              />
            </div>
          </div>

          <div className="mt-2 flex justify-between font-mono text-[0.62rem] uppercase tracking-widest">
            <span className="text-volt">◂ Faster / Under</span>
            <span className="text-muted">Line {formatDuration(lineSeconds)}</span>
            <span className="text-coral">Over / Slower ▸</span>
          </div>
        </>
      )}
    </div>
  );
}
