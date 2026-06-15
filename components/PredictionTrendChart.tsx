'use client'

import { formatDuration } from '@/lib/format'
import type { SnapshotRow } from '@/lib/snapshots'

export function PredictionTrendChart({
  history,
  lineSeconds,
}: {
  history: SnapshotRow[]
  lineSeconds: number
}) {
  if (history.length === 0) {
    return (
      <div className="panel p-6 rise">
        <p className="eyebrow">Prediction history</p>
        <p className="text-muted text-sm mt-2">No history yet — check back as you train</p>
      </div>
    )
  }

  // Sort by date
  const sorted = [...history].sort((a, b) => a.snapshot_date.localeCompare(b.snapshot_date))

  // Filter out nulls and get valid predictions
  const validSnapshots = sorted.filter((s) => s.projected_seconds !== null)

  if (validSnapshots.length === 0) {
    return (
      <div className="panel p-6 rise">
        <p className="eyebrow">Prediction history</p>
        <p className="text-muted text-sm mt-2">No predictions yet</p>
      </div>
    )
  }

  const predictions = validSnapshots.map((s) => ({
    date: s.snapshot_date,
    seconds: s.projected_seconds!,
    margin: lineSeconds - s.projected_seconds!,
  }))

  // Find range
  const allSeconds = predictions.map((p) => p.seconds)
  const minSeconds = Math.min(...allSeconds)
  const maxSeconds = Math.max(...allSeconds)
  const secondsRange = maxSeconds - minSeconds || 1

  const svgWidth = 1000
  const svgHeight = 300
  const padding = { top: 40, right: 30, bottom: 50, left: 80 }
  const chartWidth = svgWidth - padding.left - padding.right
  const chartHeight = svgHeight - padding.top - padding.bottom

  // Normalize coordinates
  const normalizeX = (index: number) => padding.left + (index / (predictions.length - 1 || 1)) * chartWidth
  const normalizeY = (seconds: number) =>
    padding.top + chartHeight - ((seconds - minSeconds) / secondsRange) * chartHeight

  // Line and area
  const points = predictions.map((p, i) => `${normalizeX(i)},${normalizeY(p.seconds)}`).join(' ')
  const lineY = normalizeY(lineSeconds)

  // Current prediction
  const currentPrediction = predictions[predictions.length - 1]
  const currentY = normalizeY(currentPrediction.seconds)
  const isUnder = currentPrediction.margin > 0

  return (
    <div className="panel p-6 rise space-y-4">
      <p className="eyebrow">Prediction history</p>

      <div className="bg-ink-3/50 rounded-lg p-4 overflow-x-auto">
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full min-w-full h-56">
          {/* Line */}
          <line
            x1={padding.left}
            y1={lineY}
            x2={svgWidth - padding.right}
            y2={lineY}
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="6"
            opacity="0.4"
            className="text-bone"
          />

          {/* Y-axis */}
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={svgHeight - padding.bottom}
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.3"
            className="text-bone"
          />

          {/* X-axis */}
          <line
            x1={padding.left}
            y1={svgHeight - padding.bottom}
            x2={svgWidth - padding.right}
            y2={svgHeight - padding.bottom}
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.3"
            className="text-bone"
          />

          {/* Y-axis labels */}
          <text x={padding.left - 10} y={padding.top + 5} fontSize="12" textAnchor="end" fill="currentColor" className="text-muted">
            {formatDuration(Math.round(maxSeconds))}
          </text>
          <text x={padding.left - 10} y={lineY + 5} fontSize="12" textAnchor="end" fill="currentColor" className="text-bone font-semibold">
            {formatDuration(lineSeconds)}
          </text>
          <text x={padding.left - 10} y={svgHeight - padding.bottom + 5} fontSize="12" textAnchor="end" fill="currentColor" className="text-muted">
            {formatDuration(Math.round(minSeconds))}
          </text>

          {/* Area under curve */}
          <polygon
            points={`${padding.left},${svgHeight - padding.bottom} ${points} ${svgWidth - padding.right},${svgHeight - padding.bottom}`}
            fill="currentColor"
            fillOpacity="0.08"
            className={isUnder ? 'text-volt' : 'text-coral'}
          />

          {/* Main line */}
          <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2.5" className={isUnder ? 'text-volt' : 'text-coral'} />

          {/* Data points */}
          {predictions.map((p, i) => {
            const isLastPoint = i === predictions.length - 1
            return (
              <circle
                key={i}
                cx={normalizeX(i)}
                cy={normalizeY(p.seconds)}
                r={isLastPoint ? '5' : '3'}
                fill="currentColor"
                className={isUnder ? 'text-volt' : 'text-coral'}
                opacity={isLastPoint ? '1' : '0.7'}
              />
            )
          })}

          {/* X-axis labels (every 5th day or so) */}
          {predictions.map((p, i) => {
            if (i % Math.max(1, Math.floor(predictions.length / 8)) !== 0) return null
            return (
              <text
                key={`label-${i}`}
                x={normalizeX(i)}
                y={svgHeight - padding.bottom + 20}
                fontSize="11"
                textAnchor="middle"
                fill="currentColor"
                className="text-muted"
              >
                {p.date.slice(5)}
              </text>
            )
          })}
        </svg>
      </div>

      {/* Legend and stats */}
      <div className="space-y-3 pt-4 border-t border-line">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted mb-1">Current prediction</p>
            <p className={`font-display text-2xl font-mono ${isUnder ? 'text-volt' : 'text-coral'}`}>
              {formatDuration(Math.round(currentPrediction.seconds))}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted mb-1">Progress</p>
            <p className={`font-mono text-sm ${isUnder ? 'text-volt' : 'text-coral'}`}>
              {isUnder ? '−' : '+'}
              {formatDuration(Math.abs(currentPrediction.margin))}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted mb-1">Days tracked</p>
            <p className="font-display text-2xl">{predictions.length}</p>
          </div>
        </div>

        {predictions.length > 1 && (
          <div className="pt-2 border-t border-line text-xs text-muted">
            <p>
              Started at {formatDuration(Math.round(predictions[0].seconds))} —{' '}
              <span className={predictions[0].seconds > currentPrediction.seconds ? 'text-volt' : 'text-coral'}>
                {predictions[0].seconds > currentPrediction.seconds ? 'improved' : 'declined'}{' '}
                {formatDuration(Math.abs(predictions[0].seconds - currentPrediction.seconds))}
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
