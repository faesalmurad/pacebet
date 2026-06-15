'use client'

import { formatDuration, formatPace } from '@/lib/format'
import type { PaceAnalysis } from '@/lib/runAnalysis'

export function PaceBasedProjection({ analysis, lineSeconds }: { analysis: PaceAnalysis | null; lineSeconds: number }) {
  if (!analysis) {
    return (
      <div className="panel p-6">
        <p className="eyebrow">Pace-based projection</p>
        <p className="text-muted text-sm mt-2">Need recent run data to calculate</p>
      </div>
    )
  }

  const projectedSeconds = Math.round(analysis.finalPrediction)
  const marginSeconds = lineSeconds - projectedSeconds
  const side = marginSeconds > 0 ? ('under' as const) : ('over' as const)

  return (
    <div className="panel p-6 space-y-6">
      <div>
        <p className="eyebrow">Pace-based projection</p>
        <div className="mt-4 space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm text-muted mb-1">Predicted finish</p>
              <p className={`font-display text-4xl font-mono ${side === 'under' ? 'text-volt' : 'text-coral'}`}>
                {formatDuration(projectedSeconds)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted mb-1">vs. line</p>
              <p className={`font-mono text-sm ${side === 'under' ? 'text-volt' : 'text-coral'}`}>
                {side === 'under' ? '−' : '+'}
                {formatDuration(Math.abs(marginSeconds))}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Key metrics */}
      <div className="border-t border-line pt-4 space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-ink-3/50 p-3 rounded">
            <p className="text-xs text-muted mb-1">Threshold pace</p>
            <p className="font-mono font-semibold text-sm">{formatPace(analysis.thresholdPace)}</p>
            <p className="text-[0.65rem] text-muted mt-0.5">tempo runs</p>
          </div>
          <div className="bg-ink-3/50 p-3 rounded">
            <p className="text-xs text-muted mb-1">Critical speed</p>
            <p className="font-mono font-semibold text-sm">{formatPace(analysis.fastestSustainablePace)}</p>
            <p className="text-[0.65rem] text-muted mt-0.5">hard efforts</p>
          </div>
          <div className="bg-ink-3/50 p-3 rounded">
            <p className="text-xs text-muted mb-1">Long run pace</p>
            <p className="font-mono font-semibold text-sm">{formatPace(analysis.longRunPace)}</p>
            <p className="text-[0.65rem] text-muted mt-0.5">race pace</p>
          </div>
        </div>
      </div>

      {/* Trend & condition */}
      <div className="border-t border-line pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <p className="text-xs text-muted mb-1">Pace trend</p>
          <p className={`font-semibold capitalize ${analysis.trendDirection === 'improving' ? 'text-volt' : analysis.trendDirection === 'declining' ? 'text-coral' : 'text-muted'}`}>
            {analysis.trendDirection}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted mb-1">Volume</p>
          <p className={`font-semibold capitalize ${analysis.volumeTrend === 'increasing' ? 'text-volt' : analysis.volumeTrend === 'decreasing' ? 'text-coral' : 'text-muted'}`}>
            {analysis.volumeTrend}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted mb-1">Consistency</p>
          <p className="font-semibold">{(analysis.paceConsistency * 100).toFixed(0)}%</p>
        </div>
        <div>
          <p className="text-xs text-muted mb-1">Recent volume</p>
          <p className="font-semibold">{analysis.recentVolume.toFixed(1)} mi</p>
        </div>
      </div>

      {/* How it works */}
      <div className="border-t border-line pt-4">
        <p className="text-xs text-muted mb-2">
          <span className="font-semibold">How:</span> Weighted analysis of threshold pace (45%), critical speed (35%), long run pace (15%), trend adjustment (5%). Accounts for pace trends, recent volume, and training consistency.
        </p>
      </div>
    </div>
  )
}
