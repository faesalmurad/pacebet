'use client'

import { formatDuration } from '@/lib/format'
import type { SnapshotRow } from '@/lib/snapshots'

export function ProjectionHistory({
  snapshots,
  lineSeconds,
}: {
  snapshots: SnapshotRow[]
  lineSeconds: number
}) {
  if (snapshots.length < 2) {
    return (
      <div className="panel p-6">
        <p className="eyebrow">Projection trend</p>
        <p className="text-muted text-sm mt-3">
          More data coming as you train. Check back tomorrow.
        </p>
      </div>
    )
  }

  // Find min/max projected times for scaling
  const valid = snapshots.filter((s) => s.projected_seconds !== null)
  if (valid.length === 0) {
    return (
      <div className="panel p-6">
        <p className="eyebrow">Projection trend</p>
        <p className="text-muted text-sm mt-3">No projections yet.</p>
      </div>
    )
  }

  const minTime = Math.min(...valid.map((s) => s.projected_seconds!))
  const maxTime = Math.max(...valid.map((s) => s.projected_seconds!))
  const timeRange = maxTime - minTime || 1

  // Pad the range by 5% for breathing room
  const padding = timeRange * 0.05
  const bottomTime = minTime - padding
  const topTime = maxTime + padding
  const displayRange = topTime - bottomTime

  const chartHeight = 200
  const chartWidth = 100 // percent

  // SVG viewBox in time-domain coordinates
  const viewBox = `0 0 ${snapshots.length - 1} ${displayRange}`

  // Convert a time value to SVG y coordinate
  const timeToY = (s: number) => displayRange - (s - bottomTime)

  // Convert snapshot index to SVG x coordinate
  const indexToX = (i: number) => i

  // Build the line path
  const pathD = valid
    .map((snap, idx) => {
      const dataIdx = snapshots.indexOf(snap)
      const x = indexToX(dataIdx)
      const y = timeToY(snap.projected_seconds!)
      return `${x},${y}`
    })
    .join(' L ')

  const lastValid = valid[valid.length - 1]
  const currentProj = lastValid.projected_seconds!
  const marginFromLine = lineSeconds - currentProj
  const improvingOrFading = marginFromLine > 0 ? 'under' : 'over'
  const trendColor = improvingOrFading === 'under' ? 'text-volt' : 'text-coral'

  return (
    <div className="panel p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <p className="eyebrow">Projection trend</p>
        <div className="text-right">
          <p className={`font-display text-3xl tabular ${trendColor}`}>
            {formatDuration(currentProj)}
          </p>
          <p className={`text-xs font-mono tracking-widest uppercase ${trendColor}`}>
            {improvingOrFading} by {formatDuration(Math.abs(marginFromLine))}
          </p>
        </div>
      </div>

      <div className="relative" style={{ height: chartHeight }}>
        <svg
          viewBox={viewBox}
          preserveAspectRatio="none"
          className="w-full h-full"
          style={{ overflow: 'visible' }}
        >
          {/* Grid line at the target (line_seconds) */}
          <line
            x1="0"
            y1={timeToY(lineSeconds)}
            x2={snapshots.length - 1}
            y2={timeToY(lineSeconds)}
            stroke="rgba(244, 241, 234, 0.2)"
            strokeWidth="0.02"
            strokeDasharray="0.1"
          />

          {/* The projection line */}
          {pathD && (
            <polyline
              points={pathD}
              fill="none"
              stroke={improvingOrFading === 'under' ? '#c6ff3a' : '#ff5436'}
              strokeWidth="0.04"
              vectorEffect="non-scaling-stroke"
            />
          )}

          {/* Dots at each data point */}
          {valid.map((snap, idx) => {
            const dataIdx = snapshots.indexOf(snap)
            const x = indexToX(dataIdx)
            const y = timeToY(snap.projected_seconds!)
            return (
              <circle
                key={snap.snapshot_date}
                cx={x}
                cy={y}
                r="0.05"
                fill={improvingOrFading === 'under' ? '#c6ff3a' : '#ff5436'}
                vectorEffect="non-scaling-stroke"
              />
            )
          })}
        </svg>

        {/* Y-axis labels */}
        <div className="absolute inset-y-0 -left-12 flex flex-col justify-between text-[0.6rem] text-muted font-mono tabular">
          <span>{formatDuration(topTime)}</span>
          <span>{formatDuration(lineSeconds)}</span>
          <span>{formatDuration(bottomTime)}</span>
        </div>
      </div>

      <p className="text-xs text-muted mt-3">
        Last {snapshots.length} day{snapshots.length === 1 ? '' : 's'} of training
      </p>
    </div>
  )
}
