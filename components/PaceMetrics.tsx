'use client'

import { formatPace } from '@/lib/format'
import type { PaceAnalysis } from '@/lib/runAnalysis'

export function PaceMetrics({ analysis }: { analysis: PaceAnalysis }) {
  const metrics = [
    {
      label: 'Threshold pace',
      value: formatPace(analysis.thresholdPace),
      subtitle: 'Tempo run pace',
      accent: 'amber',
    },
    {
      label: 'Critical speed',
      value: formatPace(analysis.fastestSustainablePace),
      subtitle: 'Hard effort pace',
      accent: 'coral',
    },
    {
      label: 'Long run pace',
      value: formatPace(analysis.longRunPace),
      subtitle: 'Race-specific',
      accent: 'volt',
    },
    {
      label: 'Pace trend',
      value: analysis.trendDirection.charAt(0).toUpperCase() + analysis.trendDirection.slice(1),
      subtitle: 'Last 7 days',
      accent:
        analysis.trendDirection === 'improving'
          ? 'volt'
          : analysis.trendDirection === 'declining'
            ? 'coral'
            : 'muted',
    },
    {
      label: 'Consistency',
      value: `${(analysis.paceConsistency * 100).toFixed(0)}%`,
      subtitle: 'Pace variability',
      accent: 'volt',
    },
    {
      label: 'Recent volume',
      value: `${analysis.recentVolume.toFixed(1)}`,
      subtitle: 'Miles (last 7d)',
      accent: analysis.recentVolume > 20 ? 'volt' : 'muted',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 rise">
      {metrics.map((m, i) => (
        <div key={i} className={`panel p-4 bg-ink-3/30 border border-${m.accent}/10`}>
          <p className="text-xs text-muted mb-2">{m.label}</p>
          <p className={`font-display text-2xl font-mono text-${m.accent}`}>{m.value}</p>
          <p className="text-[0.65rem] text-muted mt-1">{m.subtitle}</p>
        </div>
      ))}
    </div>
  )
}
