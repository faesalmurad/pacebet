import Link from "next/link";
import { getRace, getBets, RACE_SLUG } from "@/lib/data";
import { tallyBets } from "@/lib/stats";
import { formatDuration } from "@/lib/format";
import { SettleForm, SettingsForm, ReopenForm } from "@/components/SettleForms";
import { Leaderboard } from "@/components/Leaderboard";

export const dynamic = "force-dynamic";

export default async function SettlePage() {
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

  const bets = await getBets(race.id);
  const tally = tallyBets(bets);
  const winnerSide =
    race.settled && race.actual_seconds !== null
      ? race.actual_seconds <= race.line_seconds
        ? ("under" as const)
        : ("over" as const)
      : null;
  const winners = bets.filter((b) => b.pick === winnerSide);
  const winningPot = winners.reduce((s, b) => s + (Number(b.stake) || 0), 0);

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 sm:py-12 space-y-6">
      <div className="rise">
        <p className="eyebrow">Race control</p>
        <h1 className="font-display text-5xl sm:text-6xl mt-2">Settle up</h1>
        <p className="text-muted mt-3">
          Current line:{" "}
          <span className="font-mono text-bone tabular">
            {formatDuration(race.line_seconds)}
          </span>{" "}
          · {race.settled ? "Settled" : "Open for bets"}
        </p>
      </div>

      {race.settled && winnerSide && (
        <div className="panel p-6 glow-volt rise">
          <p className="eyebrow">Results</p>
          <p className="font-display text-3xl mt-2">
            {race.runner_name} ran{" "}
            <span
              className={winnerSide === "under" ? "text-volt" : "text-coral"}
            >
              {formatDuration(race.actual_seconds!)}
            </span>
          </p>
          <p className="text-muted mt-1">
            {winnerSide.toUpperCase()} wins · {winners.length} winner
            {winners.length === 1 ? "" : "s"}
            {winningPot > 0 && (
              <> splitting a ${tally.totalPot.toLocaleString()} pot</>
            )}
          </p>
          {winners.length > 0 && (
            <div className="mt-4">
              <Leaderboard bets={winners} winnerSide={winnerSide} />
            </div>
          )}
        </div>
      )}

      <div className="rise" style={{ animationDelay: "0.06s" }}>
        {race.settled ? <ReopenForm /> : <SettleForm race={race} />}
      </div>

      <div className="rise" style={{ animationDelay: "0.12s" }}>
        <SettingsForm race={race} />
      </div>
    </div>
  );
}
