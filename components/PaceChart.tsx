'use client'

import { formatPace } from '@/lib/format'

interface PaceChartProps {
  movingTimeS: number
  distanceM: number
  avgPaceSecPerMile: number
}

export function PaceChart({ movingTimeS, distanceM, avgPaceSecPerMile }: PaceChartProps) {
  const miles = distanceM / 1609.34
  const minutesPerMile = avgPaceSecPerMile / 60

  // Estimate splits assuming slight fatigue curve (2-3% slowdown per mile)
  const splits: number[] = []
  for (let i = 0; i < Math.ceil(miles); i++) {
    const fatigueMultiplier = 1 + i * 0.015
    const splitPace = avgPaceSecPerMile * fatigueMultiplier
    splits.push(splitPace)
  }

  const maxPace = Math.max(...splits)
  const minPace = Math.min(...splits)
  const paceRange = maxPace - minPace

  const chartHeight = 200
  const chartPadding = 20
  const chartWidth = 100

  // Normalize pace values to SVG coordinates
  const normalizePace = (pace: number) => {
    if (paceRange === 0) return chartHeight / 2
    return chartHeight - ((pace - minPace) / paceRange) * (chartHeight - chartPadding * 2) - chartPadding
  }

  const points = splits
    .slice(0, Math.ceil(miles))
    .map((pace, i) => {
      const x = (i / miles) * chartWidth
      const y = normalizePace(pace)
      return `${x},${y}`
    })
    .join(' ')

  return (
    <div className="panel p-6 space-y-4">
      <div className="flex items-center justify-between">
        <p className="eyebrow">Pace throughout run</p>
        <p className="text-sm text-muted">Estimated splits (assuming slight fatigue)</p>
      </div>

      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="w-full h-40 bg-ink-3/50 rounded-lg"
        preserveAspectRatio="none"
      >
        {/* Grid lines */}
        <line x1="0" y1={normalizePace(avgPaceSecPerMile)} x2={chartWidth} y2={normalizePace(avgPaceSecPerMile)} stroke="currentColor" strokeWidth="0.5" opacity="0.2" className="text-bone" />

        {/* Pace line */}
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-volt"
        />

        {/* Area fill */}
        <polygon
          points={`0,${chartHeight} ${points} ${chartWidth},${chartHeight}`}
          fill="currentColor"
          fillOpacity="0.1"
          className="text-volt"
        />
      </svg>

      {/* Split details */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <p className="text-xs text-muted mb-1">Fastest mile</p>
          <p className="font-mono font-semibold">{formatPace(minPace)}</p>
        </div>
        <div>
          <p className="text-xs text-muted mb-1">Average pace</p>
          <p className="font-mono font-semibold">{formatPace(avgPaceSecPerMile)}</p>
        </div>
        <div>
          <p className="text-xs text-muted mb-1">Slowest mile</p>
          <p className="font-mono font-semibold">{formatPace(maxPace)}</p>
        </div>
      </div>

      {/* Mile splits table */}
      <div className="mt-6 border-t border-line pt-4">
        <p className="eyebrow text-sm mb-3">Mile-by-mile splits</p>
        <div className="grid grid-cols-auto gap-2 text-xs">
          {splits.slice(0, Math.ceil(miles)).map((pace, i) => (
            <div key={i} className="flex items-center gap-3 py-1.5 px-2 bg-ink-3/50 rounded">
              <span className="font-semibold text-volt w-6">Mile {i + 1}</span>
              <span className="font-mono text-muted">{formatPace(pace)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
