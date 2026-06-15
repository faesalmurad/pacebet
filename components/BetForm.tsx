'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { placeBet, type ActionState } from '@/app/actions'

const initial: ActionState = { ok: false }

export function BetForm() {
  const [pick, setPick] = useState<'over' | 'under'>('under')
  const [state, formAction, pending] = useActionState(placeBet, initial)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.ok) formRef.current?.reset()
  }, [state.ok])

  return (
    <form ref={formRef} action={formAction} className="panel p-6 space-y-5">
      <div>
        <p className="eyebrow">Place a bet</p>
        <p className="text-sm text-muted mt-1">
          Predict a finish time. Pick over or under. Pending approval.
        </p>
      </div>

      <div>
        <label className="eyebrow block mb-1.5">Target finish time</label>
        <input
          name="target_time"
          type="text"
          placeholder="3:58:21"
          pattern="^\d{1,2}:\d{2}:\d{2}$"
          required
          className="field tabular"
        />
        <p className="text-xs text-muted mt-1">Format: H:MM:SS or HH:MM:SS</p>
      </div>

      <input type="hidden" name="pick" value={pick} />
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setPick('under')}
          className={`rounded-xl border p-4 text-left transition-all ${
            pick === 'under'
              ? 'border-volt bg-volt/10 glow-volt'
              : 'border-line hover:border-line-strong'
          }`}
        >
          <p className="font-display text-3xl text-volt">Under</p>
          <p className="text-xs text-muted mt-1">Beats the time</p>
        </button>
        <button
          type="button"
          onClick={() => setPick('over')}
          className={`rounded-xl border p-4 text-left transition-all ${
            pick === 'over'
              ? 'border-coral bg-coral/10 glow-coral'
              : 'border-line hover:border-line-strong'
          }`}
        >
          <p className="font-display text-3xl text-coral">Over</p>
          <p className="text-xs text-muted mt-1">Misses the time</p>
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="eyebrow block mb-1.5">Your name</label>
          <input
            name="bettor_name"
            required
            maxLength={40}
            placeholder="e.g. Marcus"
            className="field"
          />
        </div>
        <div>
          <label className="eyebrow block mb-1.5">Stake ($, optional)</label>
          <input
            name="stake"
            type="number"
            min={0}
            step={1}
            placeholder="0"
            className="field tabular"
          />
        </div>
      </div>

      <div>
        <label className="eyebrow block mb-1.5">Notes (optional)</label>
        <textarea
          name="note"
          maxLength={280}
          rows={2}
          placeholder="Add a note…"
          className="field resize-none"
        />
      </div>

      <button type="submit" disabled={pending} className="btn btn-primary w-full">
        {pending ? 'Placing…' : 'Place bet'}
      </button>

      {state.error && (
        <p className="text-coral text-sm font-mono">⚠ {state.error}</p>
      )}
      {state.ok && state.message && (
        <p className="text-volt text-sm font-mono">✓ {state.message}</p>
      )}
    </form>
  )
}
