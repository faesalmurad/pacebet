import Link from "next/link";
import { getRace, getActivities, getBets, RACE_SLUG } from "@/lib/data";
import { projectFinish, tallyBets } from "@/lib/stats";
import { formatDuration } from "@/lib/format";
import { BetForm } from "@/components/BetForm";
import { BetSplitBar } from "@/components/BetSplitBar";
import { Leaderboard } from "@/components/Leaderboard";

export const dynamic = "force-dynamic";

export default async function BetsPage() {
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

  const [activities, bets] = await Promise.all([
    getActivities(race.id),
    getBets(race.id),
  ]);
  const projection = projectFinish(activities, race);
  const tally = tallyBets(bets);
  const lineLabel = formatDuration(race.line_seconds);
  const winnerSide =
    race.settled && race.actual_seconds !== null
      ? race.actual_seconds <= race.line_seconds
        ? ("under" as const)
        : ("over" as const)
      : null;

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 sm:py-12">
      <div className="rise">
        <p className="eyebrow">{race.race_name}</p>
        <h1 className="font-display text-5xl sm:text-6xl mt-2">The book</h1>
        <p className="text-muted mt-3 max-w-xl">
          The line is{" "}
          <span className="text-bone font-mono tabular">{lineLabel}</span>.
          {projection.seconds !== null && !race.settled && (
            <>
              {" "}
              Current training projects a{" "}
              <span
                className={projection.side === "under" ? "text-volt" : "text-coral"}
              >
                {formatDuration(projection.seconds)} ({projection.side})
              </span>{" "}
              finish — but anything can happen on race day.
            </>
          )}
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mt-8">
        <div className="rise" style={{ animationDelay: "0.06s" }}>
          {race.settled ? (
            <div className="panel p-8 text-center">
              <p className="font-display text-3xl">Betting closed</p>
              <p className="text-muted mt-2">
                Race settled at{" "}
                <span className="font-mono text-bone">
                  {formatDuration(race.actual_seconds!)}
                </span>
                .{" "}
                <span
                  className={winnerSide === "under" ? "text-volt" : "text-coral"}
                >
                  {winnerSide?.toUpperCase()} took it.
                </span>
              </p>
              <Link href="/" className="btn mt-6">
                Back to board
              </Link>
            </div>
          ) : (
            <BetForm />
          )}
        </div>

        <div className="space-y-6 rise" style={{ animationDelay: "0.12s" }}>
          <BetSplitBar tally={tally} />
          <div>
            <p className="eyebrow mb-3">Everyone&apos;s calls</p>
            <Leaderboard bets={bets} winnerSide={winnerSide} showDelete={true} />
          </div>
        </div>
      </div>
    </div>
  );
}
