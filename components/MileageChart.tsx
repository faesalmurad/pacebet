import type { WeekBucket } from "@/lib/stats";

const FMT = new Intl.DateTimeFormat("en-US", { month: "numeric", day: "numeric" });

export function MileageChart({ weeks }: { weeks: WeekBucket[] }) {
  const max = Math.max(1, ...weeks.map((w) => w.miles));
  const peak = weeks.reduce((m, w) => Math.max(m, w.miles), 0);

  return (
    <div className="panel p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <p className="eyebrow">Weekly mileage · last 12 weeks</p>
        <p className="font-mono text-xs text-muted">
          peak <span className="text-bone">{peak.toFixed(0)} mi</span>
        </p>
      </div>

      <div className="mt-6 flex items-end gap-1.5 sm:gap-2 h-40">
        {weeks.map((w, i) => {
          const h = Math.max(3, (w.miles / max) * 100);
          return (
            <div
              key={w.weekStart.toISOString()}
              className="flex-1 flex flex-col items-center justify-end h-full group"
            >
              <span
                className={`font-mono text-[0.6rem] mb-1.5 tabular transition-opacity ${
                  w.isCurrent ? "text-volt" : "text-muted opacity-0 group-hover:opacity-100"
                }`}
              >
                {w.miles.toFixed(0)}
              </span>
              <div
                className={`w-full rounded-t-[3px] origin-bottom transition-colors ${
                  w.isCurrent
                    ? "bg-volt glow-volt"
                    : "bg-ink-3 group-hover:bg-bone/30"
                }`}
                style={{ height: `${h}%` }}
              />
              <span className="font-mono text-[0.55rem] text-muted mt-2 tabular">
                {FMT.format(w.weekStart)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
