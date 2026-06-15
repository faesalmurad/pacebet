'use client'

import { formatPace } from '@/lib/format'
import type { PaceAnalysis } from '@/lib/runAnalysis'

interface PredictorChartProps {
  paces: PaceAnalysis['paces']
}

export function PredictorChart({ paces }: PredictorChartProps) {
  if (paces.length === 0) return null

  // Sort by date
  const sorted = [...paces].sort((a, b) => a.date.localeCompare(b.date))

  // Find pace range
  const allPaces = sorted.map((p) => p.pace)
  const minPace = Math.min(...allPaces)
  const maxPace = Math.max(...allPaces)
  const paceRange = maxPace - minPace || 1

  // Color by type
  const typeColors: Record<string, string> = {
    easy: '#888',
    long: '#0ff',
    tempo: '#ffa500',
    interval: '#ff6b9d',
    recovery: '#999',
  }

  const svgWidth = 1000
  const svgHeight = 300
  const padding = { top: 40, right: 30, bottom: 50, left: 60 }
  const chartWidth = svgWidth - padding.left - padding.right
  const chartHeight = svgHeight - padding.top - padding.bottom

  // Normalize coordinates
  const normalizeX = (index: number) => padding.left + (index / (sorted.length - 1 || 1)) * chartWidth
  const normalizeY = (pace: number) => padding.top + chartHeight - ((pace - minPace) / paceRange) * chartHeight

  // Generate points for area
  const areaPoints = sorted
    .map((p, i) => `${normalizeX(i)},${normalizeY(p.pace)}`)
    .join(' ')

  // Average pace line
  const avgPace = allPaces.reduce((a, b) => a + b) / allPaces.length
  const avgY = normalizeY(avgPace)

  return (
    <div className="panel p-6 rise space-y-4">
      <p className="eyebrow">Pace over time</p>

      <div className="bg-ink-3/50 rounded-lg p-4 overflow-x-auto">
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full min-w-full h-56">
          {/* Grid lines */}
          <line
            x1={padding.left}
            y1={avgY}
            x2={svgWidth - padding.right}
            y2={avgY}
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="4"
            opacity="0.2"
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
            {formatPace(maxPace)}
          </text>
          <text x={padding.left - 10} y={svgHeight - padding.bottom + 5} fontSize="12" textAnchor="end" fill="currentColor" className="text-muted">
            {formatPace(minPace)}
          </text>

          {/* Average pace line */}
          <line
            x1={padding.left}
            y1={avgY}
            x2={svgWidth - padding.right}
            y2={avgY}
            stroke="currentColor"
            strokeWidth="1.5"
            opacity="0.3"
            className="text-volt"
          />

          {/* Area under curve */}
          <polygon
            points={`${padding.left},${svgHeight - padding.bottom} ${areaPoints} ${svgWidth - padding.right},${svgHeight - padding.bottom}`}
            fill="currentColor"
            fillOpacity="0.08"
            className="text-volt"
          />

          {/* Main line */}
          <polyline points={areaPoints} fill="none" stroke="currentColor" strokeWidth="2.5" className="text-volt" />

          {/* Data points with type coloring */}
          {sorted.map((p, i) => (
            <circle
              key={i}
              cx={normalizeX(i)}
              cy={normalizeY(p.pace)}
              r="4"
              fill={typeColors[p.type] || '#0ff'}
              opacity="0.9"
            />
          ))}

          {/* X-axis labels (every 5th run) */}
          {sorted.map((p, i) => {
            if (i % Math.max(1, Math.floor(sorted.length / 8)) !== 0) return null
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

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: typeColors.easy }} />
          Easy
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: typeColors.long }} />
          Long
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: typeColors.tempo }} />
          Tempo
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: typeColors.interval }} />
          Interval
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: typeColors.recovery }} />
          Recovery
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <div className="w-3 h-1 bg-volt opacity-30" />
          Average pace
        </div>
      </div>
    </div>
  )
}
