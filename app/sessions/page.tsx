'use client'

import { useState } from "react";
import Link from "next/link";
import type { Activity } from "@/lib/types";
import {
  formatDuration,
  formatMiles,
  formatPace,
  formatFullDate,
  paceSecPerMile,
} from "@/lib/format";

interface Props {
  activities: Activity[];
  raceName: string;
  totalMiles: number;
}

function SessionsContent({ activities, raceName, totalMiles }: Props) {
  const [sortBy, setSortBy] = useState<'date' | 'distance' | 'pace'>('date');
  const [minDistance, setMinDistance] = useState(0);

  const filtered = activities.filter(a => Number(a.distance_m) / 1609.34 >= minDistance);

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'date') return b.activity_date.localeCompare(a.activity_date);
    if (sortBy === 'distance') return Number(b.distance_m) - Number(a.distance_m);
    const paceA = paceSecPerMile(Number(a.distance_m), a.moving_time_s);
    const paceB = paceSecPerMile(Number(b.distance_m), b.moving_time_s);
    return paceA - paceB;
  });
  // Aggregate by week for visual grouping
  const byWeek: Record<
    string,
    Array<Activity>
  > = {};
  for (const a of sorted) {
    const date = new Date(a.activity_date);
    const monday = new Date(date);
    monday.setDate(date.getDate() - ((date.getDay() + 6) % 7));
    const weekKey = monday.toISOString().split("T")[0];
    if (!byWeek[weekKey]) byWeek[weekKey] = [];
    byWeek[weekKey].push(a);
  }

  const weeks = Object.entries(byWeek)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, runs]) => ({
      weekStart: date,
      runs,
      totalMiles: runs.reduce((s, r) => s + Number(r.distance_m), 0) / 1609.34,
      totalTime: runs.reduce((s, r) => s + r.moving_time_s, 0),
    }));

  return (
    <div className="mx-auto max-w-4xl px-5 py-8 sm:py-12 space-y-6">
      <div className="rise">
        <p className="eyebrow">{raceName}</p>
        <h1 className="font-display text-5xl sm:text-6xl mt-2">All sessions</h1>
        <p className="text-muted mt-3">
          {sorted.length} runs · {totalMiles.toFixed(0)} miles
        </p>
      </div>

      <div className="rise flex flex-col sm:flex-row gap-3">
        <div>
          <label className="eyebrow block mb-1.5">Sort by</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="field !w-auto"
          >
            <option value="date">Date (newest first)</option>
            <option value="distance">Distance (longest first)</option>
            <option value="pace">Pace (fastest first)</option>
          </select>
        </div>
        <div>
          <label className="eyebrow block mb-1.5">Min distance</label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0"
              max="20"
              step="1"
              value={minDistance}
              onChange={(e) => setMinDistance(Number(e.target.value))}
              className="flex-1"
            />
            <span className="font-mono text-sm text-muted w-10 text-right">
              {minDistance} mi
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {weeks.map((week, wi) => (
          <div
            key={week.weekStart}
            className="rise"
            style={{ animationDelay: `${wi * 0.04}s` }}
          >
            <div className="flex items-baseline justify-between pb-3 border-b border-line">
              <div>
                <p className="eyebrow">Week of {formatFullDate(week.weekStart)}</p>
                <p className="text-sm text-muted mt-1">
                  {week.runs.length} runs · {week.totalMiles.toFixed(1)} mi ·{" "}
                  {formatDuration(week.totalTime)}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {week.runs.map((r) => {
                const pace = paceSecPerMile(r.distance_m, r.moving_time_s);
                const miles = Number(r.distance_m) / 1609.34;
                const isLong = miles >= 10;
                return (
                  <div
                    key={r.id}
                    className={`panel p-4 flex items-start gap-4 ${
                      isLong ? "border-volt bg-volt/5" : ""
                    }`}
                  >
                    <div
                      className={`text-center shrink-0 w-16 py-2 rounded-lg ${
                        isLong
                          ? "bg-volt/20 text-volt"
                          : "bg-muted/10 text-muted"
                      }`}
                    >
                      <p className="font-display text-xl leading-none tabular">
                        {miles.toFixed(1)}
                      </p>
                      <p className="font-mono text-[0.55rem] uppercase tracking-wider mt-1">
                        mi
                      </p>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{r.name}</p>
                      <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
                        <div>
                          <p className="text-muted text-xs font-mono uppercase tracking-wider">
                            Time
                          </p>
                          <p className="font-mono tabular text-bone">
                            {formatDuration(r.moving_time_s)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted text-xs font-mono uppercase tracking-wider">
                            Pace
                          </p>
                          <p className="font-mono tabular text-bone">
                            {formatPace(pace)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted text-xs font-mono uppercase tracking-wider">
                            Date
                          </p>
                          <p className="font-mono text-bone">
                            {formatFullDate(r.activity_date)}
                          </p>
                        </div>
                      </div>
                      {r.source === "strava" && (
                        <p className="text-[0.65rem] text-muted mt-2">
                          from Strava
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <Link href="/" className="btn mt-8">
        ← Back to board
      </Link>
    </div>
  );
}

// Server component that fetches and passes data to client
import { getRace, getActivities, RACE_SLUG } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function SessionsPage() {
  const race = await getRace(RACE_SLUG);
  if (!race) {
    return (
      <div className="mx-auto max-w-xl px-5 py-32 text-center">
        <h1 className="font-display text-4xl">No race set up</h1>
        <Link href="/" className="text-volt font-mono text-sm mt-4 inline-block">
          ← back to board
        </Link>
      </div>
    );
  }

  const activities = await getActivities(race.id);
  const totalMiles = activities.reduce((s, a) => s + Number(a.distance_m), 0) / 1609.34;

  return (
    <SessionsContent
      activities={activities}
      raceName={race.race_name}
      totalMiles={totalMiles}
    />
  );
}
