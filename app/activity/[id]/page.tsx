import Link from 'next/link'
import { getRace, getActivities, RACE_SLUG } from '@/lib/data'
import { formatDuration, formatMiles, formatPace, paceSecPerMile } from '@/lib/format'
import { runAnalysis } from '@/lib/runAnalysis'

export const dynamic = 'force-dynamic'

export default async function ActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const race = await getRace(RACE_SLUG)
  if (!race) return <div>Race not found</div>

  const activities = await getActivities(race.id)
  const activity = activities.find((a) => a.id === id)

  if (!activity) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-32 text-center">
        <h1 className="font-display text-4xl">Activity not found</h1>
        <Link href="/" className="text-volt font-mono text-sm mt-4 inline-block">
          ← back to board
        </Link>
      </div>
    )
  }

  const pace = paceSecPerMile(activity.distance_m, activity.moving_time_s)
  const runType = detectRunType(activity.name)
  const analysis = runAnalysis(activities)

  // Calculate contribution to projection
  const marathonDistance = 42195 // meters
  const marathonMiles = marathonDistance / 1609.34
  const projectedFinish = Math.round(pace * marathonMiles)

  return (
    <div className="mx-auto max-w-2xl px-5 py-8 sm:py-12">
      <Link href="/" className="text-volt font-mono text-sm inline-block mb-6">
        ← back to board
      </Link>

      <div className="rise">
        <p className="eyebrow">{activity.activity_date}</p>
        <h1 className="font-display text-5xl sm:text-6xl mt-2">{activity.name}</h1>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-10">
        <div className="panel p-4">
          <p className="eyebrow text-xs mb-2">Distance</p>
          <p className="font-display text-3xl">{formatMiles(activity.distance_m)}</p>
          <p className="text-xs text-muted mt-1">miles</p>
        </div>
        <div className="panel p-4">
          <p className="eyebrow text-xs mb-2">Time</p>
          <p className="font-display text-3xl font-mono">{formatDuration(activity.moving_time_s)}</p>
          <p className="text-xs text-muted mt-1">moving</p>
        </div>
        <div className="panel p-4">
          <p className="eyebrow text-xs mb-2">Pace</p>
          <p className="font-display text-3xl font-mono">{formatPace(pace)}</p>
          <p className="text-xs text-muted mt-1">/mile</p>
        </div>
        <div className="panel p-4">
          <p className="eyebrow text-xs mb-2">Type</p>
          <p className="font-display text-2xl capitalize">{runType}</p>
          <p className="text-xs text-muted mt-1">classified</p>
        </div>
      </div>

      {/* Run Type Explanation */}
      <div className="panel p-6 mt-8">
        <p className="eyebrow mb-4">Run Classification</p>
        <p className="text-bone/80 leading-relaxed">
          {getRunTypeExplanation(runType)}
        </p>
      </div>

      {/* Contribution to Projection */}
      <div className="panel p-6 mt-8">
        <p className="eyebrow mb-4">Contribution to Marathon Projection</p>
        <div className="space-y-3 text-bone/80">
          <p>
            At {formatPace(pace)} per mile, this {formatMiles(activity.distance_m)}-mile run suggests
            a marathon finish time of <span className="text-volt font-mono">{formatDuration(projectedFinish)}</span>.
          </p>
          <p className="text-sm text-muted">
            The actual projection uses a 30-day rolling average of all runs (weighted by intensity) to account
            for training trends, not any single workout.
          </p>
        </div>
      </div>

      {/* How Predictions Work */}
      <div className="panel p-6 mt-8 border border-volt/20">
        <p className="eyebrow mb-4 text-volt">How We Predict</p>
        <div className="space-y-4 text-sm text-bone/80">
          <div>
            <p className="font-semibold mb-1">The Riegel Formula</p>
            <p className="text-muted text-xs font-mono mb-2">T₂ = T₁ × (D₂/D₁)^1.06</p>
            <p>
              We take your longest run time and scale it to marathon distance. This assumes training
              effort maintains across distances with a 1.06 exponent for fatigue.
            </p>
          </div>
          <div>
            <p className="font-semibold mb-1">The 30-Day Training Analysis</p>
            <p>
              We classify runs by type (long, tempo, interval, easy, recovery) and weight them by intensity.
              This rolling 30-day score estimates your current aerobic fitness and sustainable marathon pace.
            </p>
          </div>
          <div>
            <p className="font-semibold mb-1">Two Estimates, One Picture</p>
            <p>
              We show both approaches and their midpoint. The Riegel formula is stable but can lag fitness
              improvements; the training-based estimate responds faster to intensity but needs context.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function detectRunType(name: string): string {
  const lower = name.toLowerCase()
  if (lower.includes('long')) return 'long run'
  if (lower.includes('tempo')) return 'tempo'
  if (lower.includes('interval')) return 'interval'
  if (lower.includes('recovery')) return 'recovery'
  return 'easy run'
}

function getRunTypeExplanation(type: string): string {
  const explanations: Record<string, string> = {
    'long run':
      'Long runs build aerobic base and mental toughness. Done at an easy-to-moderate pace, they simulate race distance.',
    tempo: 'Tempo runs build lactate threshold. Sustained effort at near-marathon pace trains your aerobic capacity.',
    interval:
      'Interval workouts improve VO2 max with repeated hard efforts. These boost your overall fitness ceiling.',
    recovery: 'Recovery runs are easy-paced runs on tired legs. They promote blood flow and prepare you for harder workouts.',
    'easy run': 'Easy runs build base fitness without stress. The bulk of marathon training happens at easy pace.',
  }
  return explanations[type] || 'A training run that contributes to your overall fitness.'
}
