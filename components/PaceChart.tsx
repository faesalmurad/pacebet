'use client'

import { formatPace } from '@/lib/format'

interface PaceChartProps {
  splits?: Array<{ mile: number; pace_sec_per_mile: number }>
  avgPaceSecPerMile: number
}

export function PaceChart({ splits, avgPaceSecPerMile }: PaceChartProps) {
  // If we don't have actual splits, show a simple metric display
  if (!splits || splits.length === 0) {
    return (
      <div className="panel p-6">
        <p className="eyebrow mb-4">Pace data</p>
        <p className="text-bone/80 text-sm">
          Average pace: <span className="font-mono font-semibold">{formatPace(avgPaceSecPerMile)}</span>
        </p>
        <p className="text-muted text-xs mt-2">
          Detailed splits available when synced from Strava with streams data
        </p>
      </div>
    )
  }

  const paces = splits.map((s) => s.pace_sec_per_mile)
  const maxPace = Math.max(...paces)
  const minPace = Math.min(...paces)
  const paceRange = maxPace - minPace || 1

  const svgWidth = 600
  const svgHeight = 250
  const padding = 50

  const normalize = (pace: number, isX: boolean) => {
    if (isX) {
      const mileIndex = splits.findIndex((s) => s.pace_sec_per_mile === pace)
      return padding + (mileIndex / (splits.length - 1)) * (svgWidth - padding * 2)
    }
    return svgHeight - padding - ((pace - minPace) / paceRange) * (svgHeight - padding * 2)
  }

  const points = splits.map((s, i) => {
    const x = padding + (i / (splits.length - 1)) * (svgWidth - padding * 2)
    const y = svgHeight - padding - ((s.pace_sec_per_mile - minPace) / paceRange) * (svgHeight - padding * 2)
    return `${x},${y}`
  })

  return (
    <div className="panel p-6 space-y-4">
      <div className="flex items-center justify-between">
        <p className="eyebrow">Pace throughout run</p>
        <p className="text-sm text-muted">{splits.length} miles tracked</p>
      </div>

      {/* Chart */}
      <div className="overflow-x-auto bg-ink-3/50 rounded-lg p-4">
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full min-w-full h-48">
          {/* Y-axis label */}
          <text x="15" y="20" fontSize="12" fill="currentColor" className="text-muted">
            {formatPace(maxPace)}
          </text>
          <text x="15" y={svgHeight - 10} fontSize="12" fill="currentColor" className="text-muted">
            {formatPace(minPace)}
          </text>

          {/* Y-axis line */}
          <line
            x1={padding}
            y1={padding}
            x2={padding}
            y2={svgHeight - padding}
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.3"
            className="text-bone"
          />

          {/* X-axis line */}
          <line
            x1={padding}
            y1={svgHeight - padding}
            x2={svgWidth - padding}
            y2={svgHeight - padding}
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.3"
            className="text-bone"
          />

          {/* X-axis labels (every other mile) */}
          {splits.map((s, i) => {
            if (i % Math.max(1, Math.floor(splits.length / 5)) !== 0) return null
            const x = padding + (i / (splits.length - 1)) * (svgWidth - padding * 2)
            return (
              <text key={`label-${i}`} x={x} y={svgHeight - 20} fontSize="12" textAnchor="middle" fill="currentColor" className="text-muted">
                {s.mile}
              </text>
            )
          })}

          {/* Average pace line */}
          <line
            x1={padding}
            y1={svgHeight - padding - ((avgPaceSecPerMile - minPace) / paceRange) * (svgHeight - padding * 2)}
            x2={svgWidth - padding}
            y2={svgHeight - padding - ((avgPaceSecPerMile - minPace) / paceRange) * (svgHeight - padding * 2)}
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="4"
            opacity="0.2"
            className="text-volt"
          />

          {/* Area fill */}
          <polygon
            points={`${padding},${svgHeight - padding} ${points.join(' ')} ${svgWidth - padding},${svgHeight - padding}`}
            fill="currentColor"
            fillOpacity="0.1"
            className="text-volt"
          />

          {/* Pace line */}
          <polyline points={points.join(' ')} fill="none" stroke="currentColor" strokeWidth="2" className="text-volt" />

          {/* Data points */}
          {splits.map((s, i) => {
            const x = padding + (i / (splits.length - 1)) * (svgWidth - padding * 2)
            const y = svgHeight - padding - ((s.pace_sec_per_mile - minPace) / paceRange) * (svgHeight - padding * 2)
            return <circle key={`dot-${i}`} cx={x} cy={y} r="3" fill="currentColor" className="text-volt" />
          })}
        </svg>
      </div>

      {/* Y-axis label */}
      <p className="text-xs text-muted text-center">Miles →</p>

      {/* Split details */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <p className="text-xs text-muted mb-1">Fastest</p>
          <p className="font-mono font-semibold">{formatPace(minPace)}</p>
        </div>
        <div>
          <p className="text-xs text-muted mb-1">Average</p>
          <p className="font-mono font-semibold">{formatPace(avgPaceSecPerMile)}</p>
        </div>
        <div>
          <p className="text-xs text-muted mb-1">Slowest</p>
          <p className="font-mono font-semibold">{formatPace(maxPace)}</p>
        </div>
      </div>

      {/* Mile splits table */}
      <div className="border-t border-line pt-4">
        <p className="eyebrow text-sm mb-3">All splits</p>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 text-xs max-h-48 overflow-y-auto">
          {splits.map((s) => (
            <div key={s.mile} className="flex items-center gap-2 py-1.5 px-2 bg-ink-3/50 rounded">
              <span className="font-semibold text-volt">{s.mile}m</span>
              <span className="font-mono text-muted">{formatPace(s.pace_sec_per_mile)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
