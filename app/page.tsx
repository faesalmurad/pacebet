import Link from "next/link";
import { getRace, getActivities, getBets, RACE_SLUG } from "@/lib/data";
import { summarize, projectFinish, tallyBets } from "@/lib/stats";
import {
  formatDuration,
  formatMiles,
  formatPace,
  formatFullDate,
  daysUntil,
} from "@/lib/format";
import { getProjectionHistory } from "@/lib/snapshots";
import { analyze30Days, projectFromTraining } from "@/lib/runAnalysis";
import { Countdown } from "@/components/Countdown";
import { ProjectionMeter } from "@/components/ProjectionMeter";
import { BetSplitBar } from "@/components/BetSplitBar";
import { StatCard } from "@/components/StatCard";
import { MileageChart } from "@/components/MileageChart";
import { RecentRuns } from "@/components/RecentRuns";
import { Leaderboard } from "@/components/Leaderboard";
import { ProjectionHistory } from "@/components/ProjectionHistory";
import { DualProjections } from "@/components/DualProjections";
import { PredictionTooltip } from "@/components/PredictionTooltip";
import { SyncStravaButton } from "@/components/SyncStravaButton";

export const dynamic = "force-dynamic";

export default async function Home() {
  const race = await getRace(RACE_SLUG);
  if (!race) return <NotSetUp />;

  const [activities, bets, projectionHistory] = await Promise.all([
    getActivities(race.id),
    getBets(race.id),
    getProjectionHistory(race.id),
  ]);

  const summary = summarize(activities);
  const projection = projectFinish(activities, race);

  // Calculate secondary projection from 30-day training analysis
  const trainingAnalysis = analyze30Days(activities);
  const trainingProjectionSeconds = projectFromTraining(trainingAnalysis);

  const tally = tallyBets(bets);
  const days = daysUntil(race.race_date);
  const lineLabel = formatDuration(race.line_seconds);
  const winnerSide =
    race.settled && race.actual_seconds !== null
      ? race.actual_seconds <= race.line_seconds
        ? ("under" as const)
        : ("over" as const)
      : null;
  const weekDelta = summary.last7Miles - summary.prev7Miles;

  // Find the predictor run (longest in last 35 days)
  const now = new Date();
  const dayMs = 86_400_000;
  const recent = activities.filter(
    (a) => now.getTime() - new Date(a.activity_date).getTime() <= 35 * dayMs,
  );
  const pool = recent.length ? recent : activities;
  const predictor = pool.reduce<typeof activities[0] | null>(
    (best, a) => (!best || a.distance_m > best.distance_m ? a : best),
    null,
  );

  // Long run streak (consecutive weeks with a long run >= 10 mi)
  const longRunThreshold = 10 * 1609.34;
  let longRunStreak = 0;
  for (let w = 0; w < summary.weeks.length; w++) {
    const week = summary.weeks[summary.weeks.length - 1 - w];
    const hasLongRun = week.miles >= 10;
    if (hasLongRun) longRunStreak++;
    else break;
  }

  // Pace trend: compare avg pace in last 7 days to prior 7 days
  const last7Activities = activities.filter((a) => {
    const d = now.getTime() - new Date(a.activity_date).getTime();
    return d <= 7 * dayMs && d >= 0;
  });
  const prev7Activities = activities.filter((a) => {
    const d = now.getTime() - new Date(a.activity_date).getTime();
    return d > 7 * dayMs && d <= 14 * dayMs;
  });
  const last7Pace = last7Activities.length > 0
    ? last7Activities.reduce((s, a) => s + a.moving_time_s, 0) /
      last7Activities.reduce((s, a) => s + Number(a.distance_m), 0) *
      1609.34
    : null;
  const prev7Pace = prev7Activities.length > 0
    ? prev7Activities.reduce((s, a) => s + a.moving_time_s, 0) /
      prev7Activities.reduce((s, a) => s + Number(a.distance_m), 0) *
      1609.34
    : null;
  const paceTrend = last7Pace && prev7Pace ? last7Pace - prev7Pace : null;

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 sm:py-12 space-y-6">
      {/* HERO */}
      <section className="panel relative overflow-hidden p-6 sm:p-10 rise">
        <div className="lane-lines absolute inset-0 opacity-[0.35] pointer-events-none" />
        <div className="checker absolute top-0 left-0 right-0 h-1.5 opacity-80" />
        <div className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-volt live-dot" />
              <p className="eyebrow">
                {race.settled ? "Final result" : "Live training board"}
              </p>
            </div>
            <h1 className="font-display text-5xl sm:text-7xl mt-4 max-w-2xl">
              {race.runner_name} <span className="text-muted">vs.</span> the clock
            </h1>
            <p className="text-muted mt-3">
              {race.race_name} · {formatFullDate(race.race_date)}
            </p>
          </div>

          {/* Right: countdown or result */}
          <div className="lg:text-right shrink-0">
            {race.settled && race.actual_seconds !== null ? (
              <div>
                <p className="eyebrow">Official finish</p>
                <p
                  className={`font-display text-6xl sm:text-7xl tabular mt-1 ${
                    winnerSide === "under"
                      ? "text-volt text-glow-volt"
                      : "text-coral text-glow-coral"
                  }`}
                >
                  {formatDuration(race.actual_seconds)}
                </p>
                <p className="mt-3 font-mono text-sm">
                  <span
                    className={
                      winnerSide === "under" ? "text-volt" : "text-coral"
                    }
                  >
                    {winnerSide?.toUpperCase()} backers win
                  </span>
                </p>
              </div>
            ) : (
              <div className="lg:flex lg:flex-col lg:items-end">
                <p className="eyebrow mb-3">
                  {days > 0
                    ? `${days} day${days === 1 ? "" : "s"} to gun`
                    : days === 0
                    ? "Race day!"
                    : "Race complete"}
                </p>
                <Countdown raceDate={race.race_date} />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* PROJECTION + BOOK */}
      <section className="grid lg:grid-cols-3 gap-6 rise" style={{ animationDelay: "0.08s" }}>
        <div className="lg:col-span-2 space-y-6">
          <ProjectionMeter
            lineSeconds={race.line_seconds}
            projectedSeconds={projection.seconds}
            side={projection.side}
            marginSeconds={projection.marginSeconds}
            basisMiles={projection.basisMiles}
            predictorName={predictor?.name}
            predictorDate={predictor?.activity_date}
          />
          <ProjectionHistory
            snapshots={projectionHistory}
            lineSeconds={race.line_seconds}
          />
          <div className="flex items-start justify-between">
            <h3 className="eyebrow">Dual analysis</h3>
            <PredictionTooltip />
          </div>
          <DualProjections
            riegelSeconds={projection.seconds}
            trainingSeconds={Math.round(trainingProjectionSeconds ?? 0) || null}
            lineSeconds={race.line_seconds}
          />
        </div>
        <BetSplitBar tally={tally} />
      </section>

      {/* STATS */}
      <section
        className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 rise"
        style={{ animationDelay: "0.16s" }}
      >
        <StatCard
          label="Total"
          value={`${summary.totalMiles.toFixed(0)}`}
          sub={`${summary.totalRuns} runs`}
        />
        <StatCard
          label="Longest"
          value={`${summary.longestRunMiles.toFixed(1)}`}
          sub="miles"
          accent="volt"
        />
        <StatCard
          label="Last 7d"
          value={`${summary.last7Miles.toFixed(0)}`}
          sub={
            weekDelta >= 0
              ? `▲${weekDelta.toFixed(0)}`
              : `▼${Math.abs(weekDelta).toFixed(0)}`
          }
          accent={weekDelta >= 0 ? "volt" : "coral"}
        />
        <StatCard
          label="Avg pace"
          value={
            summary.avgPaceSecPerMile > 0
              ? formatPace(summary.avgPaceSecPerMile).replace("/mi", "")
              : "—"
          }
          sub="28 day"
          accent="amber"
        />
        <StatCard
          label="Pace trend"
          value={
            paceTrend !== null
              ? paceTrend < 0
                ? "▲"
                : "▼"
              : "—"
          }
          sub={paceTrend !== null ? `${Math.abs(Math.round(paceTrend))}s/mi` : "n/a"}
          accent={paceTrend !== null && paceTrend < 0 ? "volt" : "coral"}
        />
        <StatCard
          label="Long runs"
          value={`${longRunStreak}`}
          sub="week streak"
          accent={longRunStreak > 0 ? "volt" : undefined}
        />
      </section>

      {/* SYNC */}
      <section className="rise" style={{ animationDelay: "0.20s" }}>
        <SyncStravaButton />
      </section>

      {/* CHART */}
      <section className="rise" style={{ animationDelay: "0.24s" }}>
        <MileageChart weeks={summary.weeks} />
      </section>

      {/* RUNS + BETS */}
      <section className="grid lg:grid-cols-2 gap-6 rise" style={{ animationDelay: "0.32s" }}>
        <RecentRuns activities={activities} />
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="eyebrow">On the board</p>
            <Link href="/bets" className="font-mono text-xs text-volt hover:underline">
              see all {bets.length} →
            </Link>
          </div>
          <Leaderboard
            bets={bets}
            winnerSide={winnerSide}
            actualSeconds={race.actual_seconds ?? undefined}
            limit={4}
          />
          {!race.settled && (
            <Link href="/bets" className="btn btn-primary w-full">
              Place your bet
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}

function NotSetUp() {
  return (
    <div className="mx-auto max-w-xl px-5 py-32 text-center">
      <h1 className="font-display text-5xl">No race set up</h1>
      <p className="text-muted mt-4">
        The race for slug{" "}
        <span className="font-mono text-bone">{RACE_SLUG}</span> wasn&apos;t found.
        Check <span className="font-mono">NEXT_PUBLIC_RACE_SLUG</span> or seed the
        database.
      </p>
    </div>
  );
}
