import { formatDuration } from '@/lib/format'

export function DualProjections({
  riegelSeconds,
  trainingSeconds,
  lineSeconds,
}: {
  riegelSeconds: number | null
  trainingSeconds: number | null
  lineSeconds: number
}) {
  if (!riegelSeconds || !trainingSeconds) {
    return (
      <div className="panel p-5 sm:p-6">
        <p className="eyebrow">Two perspectives on your finish</p>
        <p className="text-muted text-sm mt-3">Not enough data yet.</p>
      </div>
    )
  }

  const avg = Math.round((riegelSeconds + trainingSeconds) / 2)
  const range = Math.abs(riegelSeconds - trainingSeconds)
  const midpointMargin = lineSeconds - avg

  return (
    <div className="panel p-5 sm:p-6">
      <p className="eyebrow mb-4">Two perspectives on your finish</p>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-ink/50 rounded-lg p-4">
          <p className="font-mono text-xs uppercase tracking-wider text-muted mb-2">
            Riegel (longest run)
          </p>
          <p className={`font-display text-2xl tabular ${riegelSeconds <= lineSeconds ? 'text-volt' : 'text-coral'}`}>
            {formatDuration(riegelSeconds)}
          </p>
        </div>

        <div className="bg-ink/50 rounded-lg p-4">
          <p className="font-mono text-xs uppercase tracking-wider text-muted mb-2">
            Training (30-day fitness)
          </p>
          <p className={`font-display text-2xl tabular ${trainingSeconds <= lineSeconds ? 'text-volt' : 'text-coral'}`}>
            {formatDuration(trainingSeconds)}
          </p>
        </div>
      </div>

      <div className="mt-5 p-4 bg-ink/50 rounded-lg">
        <div className="flex items-baseline justify-between mb-2">
          <p className="font-mono text-xs uppercase tracking-wider text-muted">Midpoint estimate</p>
          <p className={`font-display text-3xl tabular ${midpointMargin > 0 ? 'text-volt' : 'text-coral'}`}>
            {formatDuration(avg)}
          </p>
        </div>
        <p className="text-xs text-muted">
          ±{formatDuration(range / 2)} range · {Math.abs(midpointMargin) > 0 ? (midpointMargin > 0 ? '🔋' : '⏱️') : '📍'}
        </p>
      </div>
    </div>
  )
}
