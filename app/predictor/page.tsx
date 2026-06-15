import Link from 'next/link'
import { getRace, getActivities, RACE_SLUG } from '@/lib/data'
import { analyzePaceForRacePrediction } from '@/lib/runAnalysis'
import { formatDuration, formatPace, formatMiles, paceSecPerMile } from '@/lib/format'
import { PredictorChart } from '@/components/PredictorChart'
import { PaceMetrics } from '@/components/PaceMetrics'

export const dynamic = 'force-dynamic'

export default async function PredictorPage() {
  const race = await getRace(RACE_SLUG)
  if (!race) {
    return (
      <div className="mx-auto max-w-xl px-5 py-32 text-center">
        <h1 className="font-display text-4xl">No race set up</h1>
        <Link href="/" className="text-volt font-mono text-sm mt-4 inline-block">
          ← back to board
        </Link>
      </div>
    )
  }

  const activities = await getActivities(race.id)
  const analysis = analyzePaceForRacePrediction(activities)

  if (!analysis) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-8 sm:py-12">
        <Link href="/" className="text-volt font-mono text-sm inline-block mb-6">
          ← back to board
        </Link>
        <div className="rise">
          <h1 className="font-display text-5xl sm:text-6xl">Performance</h1>
          <p className="text-muted mt-3">Need recent run data to analyze</p>
        </div>
      </div>
    )
  }

  const marathonMiles = 42.195
  const projectedSeconds = Math.round(analysis.finalPrediction)
  const marginSeconds = race.line_seconds - projectedSeconds
  const side = marginSeconds > 0 ? ('under' as const) : ('over' as const)

  // Calculate prediction confidence based on data quality
  const dataQuality = Math.min(
    100,
    Math.round(
      (analysis.paces.length / 20) * 50 + // recent runs (target 20 in 30 days)
        analysis.paceConsistency * 30 + // consistency
        (analysis.recentVolume > 20 ? 20 : (analysis.recentVolume / 20) * 20), // recent volume
    ),
  )

  return (
    <div className="mx-auto max-w-4xl px-5 py-8 sm:py-12 space-y-8">
      <Link href="/" className="text-volt font-mono text-sm inline-block">
        ← back to board
      </Link>

      {/* HERO */}
      <div className="rise">
        <p className="eyebrow">Race Prediction Dashboard</p>
        <h1 className="font-display text-5xl sm:text-6xl mt-2">Performance</h1>
        <p className="text-muted mt-3">
          Detailed pace analysis for {race.runner_name}'s marathon training
        </p>
      </div>

      {/* PRIMARY PREDICTION */}
      <div className="panel p-8 rise">
        <div className="flex items-end justify-between">
          <div>
            <p className="eyebrow">Predicted finish</p>
            <p className={`font-display text-6xl sm:text-7xl tabular mt-2 ${side === 'under' ? 'text-volt' : 'text-coral'}`}>
              {formatDuration(projectedSeconds)}
            </p>
          </div>
          <div className="text-right">
            <p className="eyebrow">vs. line</p>
            <p className={`font-display text-3xl tabular mt-2 ${side === 'under' ? 'text-volt glow-volt' : 'text-coral glow-coral'}`}>
              {side === 'under' ? '−' : '+'}
              {formatDuration(Math.abs(marginSeconds))}
            </p>
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-line">
          <p className="text-xs text-muted">
            Based on {analysis.paces.length} recent runs with {(analysis.paceConsistency * 100).toFixed(0)}% consistency
          </p>
        </div>
      </div>

      {/* CONFIDENCE GAUGE */}
      <div className="panel p-6 rise">
        <p className="eyebrow mb-4">Prediction confidence</p>
        <div className="space-y-3">
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <div className="w-full h-3 bg-ink-3/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-volt to-amber transition-all"
                  style={{ width: `${dataQuality}%` }}
                />
              </div>
            </div>
            <p className="font-display text-2xl tabular w-16">{dataQuality}%</p>
          </div>
          <div className="text-xs text-muted space-y-1">
            <p>✓ {analysis.paces.length} runs analyzed (target: 20/month)</p>
            <p>✓ {(analysis.paceConsistency * 100).toFixed(0)}% pace consistency</p>
            <p>✓ {analysis.recentVolume.toFixed(0)} miles last 7 days</p>
          </div>
        </div>
      </div>

      {/* PACE TREND CHART */}
      <PredictorChart paces={analysis.paces} />

      {/* KEY METRICS GRID */}
      <PaceMetrics analysis={analysis} />

      {/* PREDICTION COMPONENTS */}
      <div className="panel p-6 rise">
        <p className="eyebrow mb-4">Prediction components</p>
        <div className="space-y-4">
          <div className="bg-ink-3/50 p-4 rounded">
            <p className="text-sm font-semibold mb-2">Threshold pace (45% weight)</p>
            <p className="font-display text-2xl font-mono">
              {formatPace(analysis.thresholdPace)}
            </p>
            <p className="text-xs text-muted mt-1">
              From {analysis.paces.filter((p) => p.type === 'tempo').length} tempo runs — closest indicator of marathon race pace
            </p>
            <p className="font-display text-lg font-mono text-muted mt-2">
              Marathon: {formatDuration(Math.round(analysis.components.thresholdBased))}
            </p>
          </div>

          <div className="bg-ink-3/50 p-4 rounded">
            <p className="text-sm font-semibold mb-2">Critical speed (35% weight)</p>
            <p className="font-display text-2xl font-mono">
              {formatPace(analysis.fastestSustainablePace)}
            </p>
            <p className="text-xs text-muted mt-1">
              From {analysis.paces.filter((p) => p.type === 'tempo' || p.type === 'interval').length} hard efforts — fastest sustainable pace
            </p>
            <p className="font-display text-lg font-mono text-muted mt-2">
              Marathon: {formatDuration(Math.round(analysis.components.criticalSpeedBased))}
            </p>
          </div>

          <div className="bg-ink-3/50 p-4 rounded">
            <p className="text-sm font-semibold mb-2">Long run pace (15% weight)</p>
            <p className="font-display text-2xl font-mono">
              {formatPace(analysis.longRunPace)}
            </p>
            <p className="text-xs text-muted mt-1">
              From {analysis.paces.filter((p) => p.type === 'long' && p.miles >= 10).length} long runs — race-specific sustainable pace
            </p>
            <p className="font-display text-lg font-mono text-muted mt-2">
              Marathon: {formatDuration(Math.round(analysis.components.longRunBased))}
            </p>
          </div>

          <div className="bg-ink-3/50 p-4 rounded">
            <p className="text-sm font-semibold mb-2">Trend adjustment (5% weight)</p>
            <p className={`font-display text-xl capitalize ${analysis.trendDirection === 'improving' ? 'text-volt' : analysis.trendDirection === 'declining' ? 'text-coral' : 'text-muted'}`}>
              {analysis.trendDirection}
            </p>
            <p className="text-xs text-muted mt-1">
              Recent pace is {analysis.trendDirection === 'improving' ? 'faster' : analysis.trendDirection === 'declining' ? 'slower' : 'stable'} than
              8-30 days ago
            </p>
            <p className="text-xs text-muted mt-2">
              {analysis.trendDirection === 'improving' && '→ 2% optimistic adjustment'}
              {analysis.trendDirection === 'declining' && '→ 2% conservative adjustment'}
              {analysis.trendDirection === 'stable' && '→ No adjustment'}
            </p>
          </div>
        </div>
      </div>

      {/* TRAINING STATUS */}
      <div className="grid lg:grid-cols-2 gap-6 rise">
        <div className="panel p-6">
          <p className="eyebrow mb-4">Training status</p>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted mb-1">Training stress score</p>
              <p className="font-display text-3xl">{Math.round(analysis.trainingStress)}</p>
              <div className="w-full h-2 bg-ink-3/50 rounded-full overflow-hidden mt-2">
                <div
                  className="h-full bg-amber transition-all"
                  style={{ width: `${Math.min(100, analysis.trainingStress)}%` }}
                />
              </div>
              <p className="text-xs text-muted mt-1">
                {analysis.trainingStress < 40 ? 'Easy' : analysis.trainingStress < 60 ? 'Moderate' : 'Hard'} training load
              </p>
            </div>
            <div className="pt-3 border-t border-line">
              <p className="text-sm text-muted mb-1">Pace consistency</p>
              <p className="font-display text-3xl">{(analysis.paceConsistency * 100).toFixed(0)}%</p>
              <p className="text-xs text-muted mt-1">How evenly paced your runs are</p>
            </div>
          </div>
        </div>

        <div className="panel p-6">
          <p className="eyebrow mb-4">Recent activity</p>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted mb-1">Last 7 days volume</p>
              <p className="font-display text-3xl">{analysis.recentVolume.toFixed(1)} mi</p>
              <p className={`text-xs mt-1 capitalize ${analysis.volumeTrend === 'increasing' ? 'text-volt' : analysis.volumeTrend === 'decreasing' ? 'text-coral' : 'text-muted'}`}>
                {analysis.volumeTrend} vs 8-14 days ago
              </p>
            </div>
            <div className="pt-3 border-t border-line">
              <p className="text-sm text-muted mb-1">Total runs analyzed</p>
              <p className="font-display text-3xl">{analysis.paces.length}</p>
              <p className="text-xs text-muted mt-1">In last 30 days</p>
            </div>
          </div>
        </div>
      </div>

      {/* EXPLANATION */}
      <div className="panel p-6 border border-volt/20 rise">
        <p className="eyebrow mb-3 text-volt">How this works</p>
        <div className="space-y-3 text-sm text-bone/80">
          <p>
            This prediction analyzes your recent pace data across different run types to estimate your marathon finish time. Instead of using a single metric,
            it weighs multiple indicators:
          </p>
          <ul className="space-y-2 ml-3 list-disc">
            <li>
              <span className="font-semibold">Threshold pace</span> comes from your tempo runs, which closely mimic marathon race effort
            </li>
            <li>
              <span className="font-semibold">Critical speed</span> represents your fastest sustainable effort from hard workouts
            </li>
            <li>
              <span className="font-semibold">Long run pace</span> shows what pace you can hold for 2+ hours, directly applicable to the marathon
            </li>
            <li>
              <span className="font-semibold">Trend</span> accounts for whether you're getting faster or slower recently
            </li>
          </ul>
          <p className="pt-2 border-t border-line">
            The confidence score reflects how much data we have. More runs, consistent pacing, and steady volume all increase confidence in the prediction.
          </p>
        </div>
      </div>
    </div>
  )
}
