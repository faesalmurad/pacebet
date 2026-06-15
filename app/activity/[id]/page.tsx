import Link from 'next/link'
import { getRace, getActivities, RACE_SLUG } from '@/lib/data'
import { formatDuration, formatMiles, formatPace, paceSecPerMile } from '@/lib/format'
import { PaceChart } from '@/components/PaceChart'

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
        <p className="eyebrow mb-4">Effort & Fitness Impact</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-ink-3/50 p-4 rounded-lg">
            <p className="text-xs text-muted mb-1">Projected finish</p>
            <p className="font-display text-2xl font-mono text-volt">{formatDuration(projectedFinish)}</p>
            <p className="text-[0.65rem] text-muted mt-1">at this pace</p>
          </div>
          <div className="bg-ink-3/50 p-4 rounded-lg">
            <p className="text-xs text-muted mb-1">Elevation gain</p>
            <p className="font-display text-2xl">—</p>
            <p className="text-[0.65rem] text-muted mt-1">not available</p>
          </div>
          <div className="bg-ink-3/50 p-4 rounded-lg">
            <p className="text-xs text-muted mb-1">Effort level</p>
            <p className="font-display text-2xl text-amber">{getEffortLevel(pace)}</p>
            <p className="text-[0.65rem] text-muted mt-1">estimated</p>
          </div>
        </div>
        <p className="text-sm text-bone/80">
          This {runType} ({formatMiles(activity.distance_m)} miles at {formatPace(pace)}/mi) contributes to your overall fitness through its
          classification. The marathon projection uses a 30-day rolling average weighted by intensity, not single workouts.
        </p>
      </div>

      {/* Pace visualization */}
      <PaceChart splits={activity.splits} avgPaceSecPerMile={pace} />
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

function getEffortLevel(paceSecPerMile: number): string {
  const pace = paceSecPerMile / 60 // convert to min/mile
  if (pace < 7) return 'Hard'
  if (pace < 8) return 'Tempo'
  if (pace < 9) return 'Moderate'
  if (pace < 10) return 'Easy'
  return 'Recovery'
}
