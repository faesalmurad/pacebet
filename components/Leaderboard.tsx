'use client'

import { useState } from 'react'
import type { Bet, Pick as BetPick } from '@/lib/types'
import { timeAgo, formatDuration } from '@/lib/format'
import { deleteBet, approveBet } from '@/app/actions'

export function Leaderboard({
  bets,
  winnerSide = null,
  actualSeconds = null,
  limit,
  showDelete = false,
}: {
  bets: Bet[]
  winnerSide?: BetPick | null
  actualSeconds?: number | null
  limit?: number
  showDelete?: boolean
}) {
  const shown = limit ? bets.slice(0, limit) : bets

  // Calculate implied odds for over/under bets only
  const ouBets = bets.filter((b) => b.pick === 'over' || b.pick === 'under')
  const totalUnder = ouBets.filter((b) => b.pick === 'under').length
  const totalOver = ouBets.filter((b) => b.pick === 'over').length
  const total = totalUnder + totalOver

  // Find closest target time bet to actual finish
  let closestTargetBet: Bet | null = null
  let closestMargin = Infinity
  if (actualSeconds !== null && actualSeconds !== undefined) {
    for (const b of bets.filter((x) => x.pick === 'target_time' && x.predicted_seconds)) {
      const margin = Math.abs(actualSeconds - b.predicted_seconds!)
      if (margin < closestMargin) {
        closestMargin = margin
        closestTargetBet = b
      }
    }
  }

  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [approvePass, setApprovePass] = useState('')

  if (bets.length === 0) {
    return (
      <div className="panel p-8 text-center">
        <p className="font-display text-2xl text-muted">No bets yet</p>
        <p className="text-sm text-muted mt-2">Be the first to call it.</p>
      </div>
    )
  }

  return (
    <ul className="space-y-2.5">
      {shown.map((b) => {
        const isTargetTime = b.pick === 'target_time'
        const isOU = b.pick === 'over' || b.pick === 'under'
        const isUnder = b.pick === 'under'
        const won = !isTargetTime && winnerSide !== null && b.pick === winnerSide
        const lost = !isTargetTime && winnerSide !== null && b.pick !== winnerSide
        const targetTimeWon = isTargetTime && closestTargetBet?.id === b.id && closestTargetBet
        const odds = total > 0 && isOU ? (isUnder ? totalUnder / total : totalOver / total) * 100 : null

        return (
          <li
            key={b.id}
            className={`panel p-4 flex items-start gap-3 ${
              won || targetTimeWon ? 'glow-volt' : ''
            } ${lost ? 'opacity-55' : ''}`}
          >
            <div
              className={`shrink-0 w-14 text-center rounded-lg py-2 ${
                isTargetTime
                  ? 'bg-amber/15 text-amber'
                  : isUnder
                    ? 'bg-volt/15 text-volt'
                    : 'bg-coral/15 text-coral'
              }`}
            >
              {isTargetTime ? (
                <>
                  <p className="font-display text-lg leading-none">T</p>
                  <p className="font-mono text-[0.55rem] uppercase tracking-wider mt-1">
                    time
                  </p>
                </>
              ) : (
                <>
                  <p className="font-display text-lg leading-none">
                    {isUnder ? 'U' : 'O'}
                  </p>
                  <p className="font-mono text-[0.55rem] uppercase tracking-wider mt-1">
                    {odds?.toFixed(0)}%
                  </p>
                </>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold">{b.bettor_name}</span>
                {b.status === 'pending' && (
                  <span className="font-mono text-[0.55rem] uppercase tracking-wider bg-muted/20 text-muted px-1.5 py-0.5 rounded">
                    Pending
                  </span>
                )}
                {won && (
                  <span className="font-mono text-[0.55rem] uppercase tracking-wider bg-volt text-ink px-1.5 py-0.5 rounded">
                    Winner
                  </span>
                )}
                {targetTimeWon && (
                  <span className="font-mono text-[0.55rem] uppercase tracking-wider bg-amber text-ink px-1.5 py-0.5 rounded">
                    Closest
                  </span>
                )}
                {lost && (
                  <span className="font-mono text-[0.55rem] uppercase tracking-wider border border-line text-muted px-1.5 py-0.5 rounded">
                    Lost
                  </span>
                )}
                <span className="font-mono text-[0.62rem] text-muted ml-auto">
                  {timeAgo(b.created_at)}
                </span>
              </div>
              {isTargetTime && b.predicted_seconds ? (
                <p className="text-sm text-bone/80 mt-1.5 font-mono tabular">
                  Predicted: {formatDuration(b.predicted_seconds)}
                  {actualSeconds !== null &&
                    ` (${Math.abs(actualSeconds - b.predicted_seconds) > 0 ? '+' : ''}${formatDuration(Math.abs(actualSeconds - b.predicted_seconds))})`}
                </p>
              ) : b.note ? (
                <p className="text-sm text-bone/80 mt-1.5 leading-snug">
                  {'"'}
                  {b.note}
                  {'"'}
                </p>
              ) : null}
            </div>

            <div className="shrink-0 flex flex-col items-end gap-2">
              {Number(b.stake) > 0 && (
                <p className="font-display text-lg tabular">
                  ${Number(b.stake).toLocaleString()}
                </p>
              )}
              {showDelete && (
                <div className="flex flex-col gap-1">
                  {b.status === 'pending' && approvingId === b.id ? (
                    <form action={approveBet} className="flex gap-1">
                      <input type="hidden" name="bet_id" value={b.id} />
                      <input
                        type="password"
                        name="passphrase"
                        placeholder="pass"
                        value={approvePass}
                        onChange={(e) => setApprovePass(e.target.value)}
                        className="field !w-20 !px-2 !py-1 text-[0.65rem]"
                        autoFocus
                      />
                      <button
                        type="submit"
                        className="btn text-[0.65rem] px-2 py-1 !bg-volt/10 !text-volt hover:!bg-volt/20"
                      >
                        OK
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setApprovingId(null)
                          setApprovePass('')
                        }}
                        className="btn text-[0.65rem] px-2 py-1 !bg-muted/10 !text-muted hover:!bg-muted/20"
                      >
                        Cancel
                      </button>
                    </form>
                  ) : b.status === 'pending' ? (
                    <button
                      type="button"
                      onClick={() => setApprovingId(b.id)}
                      className="btn text-[0.65rem] px-2 py-1 !bg-volt/10 !text-volt hover:!bg-volt/20"
                    >
                      Approve
                    </button>
                  ) : null}
                  <form action={deleteBet} className="flex gap-1">
                    <input type="hidden" name="bet_id" value={b.id} />
                    <button
                      type="submit"
                      className="btn text-[0.65rem] px-2 py-1 !bg-coral/10 !text-coral hover:!bg-coral/20"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
