"use client";

import { useActionState } from "react";
import {
  settleRace,
  updateSettings,
  reopenRace,
  type ActionState,
} from "@/app/actions";
import type { Race } from "@/lib/types";
import { formatDuration } from "@/lib/format";

const initial: ActionState = { ok: false };

function Status({ state }: { state: ActionState }) {
  if (state.error) return <p className="text-coral text-sm font-mono">⚠ {state.error}</p>;
  if (state.ok && state.message)
    return <p className="text-volt text-sm font-mono">✓ {state.message}</p>;
  return null;
}

export function SettleForm({ race }: { race: Race }) {
  const [state, action, pending] = useActionState(settleRace, initial);
  return (
    <form action={action} className="panel p-6 space-y-4">
      <div>
        <p className="font-display text-2xl">Settle the race</p>
        <p className="text-sm text-muted mt-1">
          Enter {race.runner_name}&apos;s official finish time to close the book and
          crown the winners.
        </p>
      </div>
      <div>
        <label className="eyebrow block mb-1.5">Finish time (H:MM:SS)</label>
        <input name="finish_time" placeholder="3:58:21" required className="field tabular" />
      </div>
      <div>
        <label className="eyebrow block mb-1.5">Passphrase</label>
        <input name="passphrase" type="password" required className="field" />
      </div>
      <button type="submit" disabled={pending} className="btn btn-primary w-full">
        {pending ? "Settling…" : "Settle & reveal winners"}
      </button>
      <Status state={state} />
    </form>
  );
}

export function SettingsForm({ race }: { race: Race }) {
  const [state, action, pending] = useActionState(updateSettings, initial);
  return (
    <form action={action} className="panel p-6 space-y-4">
      <div>
        <p className="font-display text-2xl">Race settings</p>
        <p className="text-sm text-muted mt-1">Edit the runner, race, date, and the line.</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="eyebrow block mb-1.5">Runner</label>
          <input name="runner_name" defaultValue={race.runner_name} required className="field" />
        </div>
        <div>
          <label className="eyebrow block mb-1.5">Race name</label>
          <input name="race_name" defaultValue={race.race_name} required className="field" />
        </div>
        <div>
          <label className="eyebrow block mb-1.5">Race date</label>
          <input
            name="race_date"
            type="date"
            defaultValue={race.race_date.split("T")[0]}
            required
            className="field tabular"
          />
        </div>
        <div>
          <label className="eyebrow block mb-1.5">Line (H:MM:SS)</label>
          <input
            name="line"
            defaultValue={formatDuration(race.line_seconds)}
            required
            className="field tabular"
          />
        </div>
      </div>
      <div>
        <label className="eyebrow block mb-1.5">Passphrase</label>
        <input name="passphrase" type="password" required className="field" />
      </div>
      <button type="submit" disabled={pending} className="btn w-full">
        {pending ? "Saving…" : "Save settings"}
      </button>
      <Status state={state} />
    </form>
  );
}

export function ReopenForm() {
  const [state, action, pending] = useActionState(reopenRace, initial);
  return (
    <form action={action} className="panel p-6 space-y-4">
      <div>
        <p className="font-display text-2xl">Reopen betting</p>
        <p className="text-sm text-muted mt-1">
          Clears the result and reopens the board. Use if you settled by mistake.
        </p>
      </div>
      <div>
        <label className="eyebrow block mb-1.5">Passphrase</label>
        <input name="passphrase" type="password" required className="field" />
      </div>
      <button type="submit" disabled={pending} className="btn w-full">
        {pending ? "Reopening…" : "Reopen"}
      </button>
      <Status state={state} />
    </form>
  );
}
