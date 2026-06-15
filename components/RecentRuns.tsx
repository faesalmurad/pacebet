import Link from "next/link";
import type { Activity } from "@/lib/types";
import {
  formatDuration,
  formatMiles,
  formatPace,
  formatShortDate,
  paceSecPerMile,
} from "@/lib/format";

export function RecentRuns({ activities }: { activities: Activity[] }) {
  // newest first
  const runs = [...activities]
    .sort((a, b) => b.activity_date.localeCompare(a.activity_date))
    .slice(0, 8);

  return (
    <div className="panel overflow-hidden">
      <div className="flex items-center justify-between p-5 sm:p-6 pb-3">
        <p className="eyebrow">Latest sessions</p>
        <p className="eyebrow !tracking-[0.12em]">{activities.length} logged</p>
      </div>
      <ul className="divide-y divide-line">
        {runs.map((r) => {
          const isLong = r.name.toLowerCase().includes("long");
          const pace = paceSecPerMile(r.distance_m, r.moving_time_s);
          return (
            <li key={r.id}>
              <Link
                href={`/activity/${r.id}`}
                className="flex items-center gap-4 px-5 sm:px-6 py-3.5 hover:bg-ink-3/50 transition-colors"
              >
                <span
                  className={`h-2 w-2 rounded-full shrink-0 ${
                    isLong ? "bg-volt" : "bg-muted"
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{r.name}</p>
                  <p className="font-mono text-[0.66rem] text-muted">
                    {formatShortDate(r.activity_date)} · {formatPace(pace)}
                  </p>
                </div>
                <div className="text-right tabular">
                  <p className={`font-display text-2xl leading-none ${isLong ? "text-volt" : ""}`}>
                    {formatMiles(r.distance_m)}
                    <span className="text-xs text-muted font-sans ml-1">mi</span>
                  </p>
                  <p className="font-mono text-[0.66rem] text-muted mt-0.5">
                    {formatDuration(r.moving_time_s)}
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
