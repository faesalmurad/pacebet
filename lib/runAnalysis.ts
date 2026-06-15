import type { Activity } from './types'
import { metersToMiles, paceSecPerMile } from './format'

export type RunType = 'easy' | 'long' | 'tempo' | 'interval' | 'recovery'

interface RunClassification {
  type: RunType
  intensity: number // 0-100
}

interface ThirtyDayAnalysis {
  totalRuns: number
  totalMiles: number
  byType: Record<RunType, { count: number; miles: number; avgPace: number }>
  avgPace: number
  longRuns: { count: number; miles: number }
  hardRuns: { count: number; miles: number }
  intensityDistribution: {
    easy: number // percent
    threshold: number
    vo2max: number
  }
  estimatedVOMax: number // mL/kg/min
  estimatedMarathonPace: number // seconds per mile
}

/** Detect run type from name and pace characteristics. */
export function classifyRun(activity: Activity, avgPace?: number): RunClassification {
  const name = activity.name.toLowerCase()
  const miles = metersToMiles(Number(activity.distance_m))
  const pace = avgPace ?? paceSecPerMile(Number(activity.distance_m), activity.moving_time_s)

  // Parse name for explicit type hints
  if (name.includes('long')) return { type: 'long', intensity: 35 }
  if (name.includes('tempo')) return { type: 'tempo', intensity: 75 }
  if (name.includes('interval') || name.includes('workout')) return { type: 'interval', intensity: 90 }
  if (name.includes('recovery')) return { type: 'recovery', intensity: 20 }

  // Heuristic: classify by distance + pace
  const thresholdPace = 480 // ~8:00/mi (example threshold)
  if (miles >= 10) return { type: 'long', intensity: 40 }
  if (pace < thresholdPace - 30) return { type: 'interval', intensity: 85 } // significantly faster
  if (pace < thresholdPace + 30) return { type: 'tempo', intensity: 70 }
  if (pace > thresholdPace + 120) return { type: 'recovery', intensity: 25 }
  return { type: 'easy', intensity: 50 }
}

/** Analyze 30 days of training for fitness metrics. */
export function analyze30Days(
  activities: Activity[],
  now = new Date(),
): ThirtyDayAnalysis {
  const dayMs = 86_400_000
  const thirtyDaysAgo = new Date(now.getTime() - 30 * dayMs)

  const recent = activities.filter((a) => {
    const d = new Date(a.activity_date)
    return d >= thirtyDaysAgo && d <= now
  })

  if (recent.length === 0) {
    return {
      totalRuns: 0,
      totalMiles: 0,
      byType: {
        easy: { count: 0, miles: 0, avgPace: 0 },
        long: { count: 0, miles: 0, avgPace: 0 },
        tempo: { count: 0, miles: 0, avgPace: 0 },
        interval: { count: 0, miles: 0, avgPace: 0 },
        recovery: { count: 0, miles: 0, avgPace: 0 },
      },
      avgPace: 0,
      longRuns: { count: 0, miles: 0 },
      hardRuns: { count: 0, miles: 0 },
      intensityDistribution: { easy: 0, threshold: 0, vo2max: 0 },
      estimatedVOMax: 0,
      estimatedMarathonPace: 0,
    }
  }

  // Calculate average pace across all runs
  const totalMeters = recent.reduce((s, a) => s + Number(a.distance_m), 0)
  const totalTime = recent.reduce((s, a) => s + a.moving_time_s, 0)
  const avgPace = totalMeters > 0 ? paceSecPerMile(totalMeters, totalTime) : 0

  // Classify each run
  const classified = recent.map((a) => ({
    activity: a,
    classification: classifyRun(a, avgPace),
    miles: metersToMiles(Number(a.distance_m)),
    pace: paceSecPerMile(Number(a.distance_m), a.moving_time_s),
  }))

  // Aggregate by type
  const byType: Record<RunType, { count: number; miles: number; avgPace: number }> = {
    easy: { count: 0, miles: 0, avgPace: 0 },
    long: { count: 0, miles: 0, avgPace: 0 },
    tempo: { count: 0, miles: 0, avgPace: 0 },
    interval: { count: 0, miles: 0, avgPace: 0 },
    recovery: { count: 0, miles: 0, avgPace: 0 },
  }

  let intensitySum = 0
  let easyMiles = 0
  let thresholdMiles = 0
  let vo2maxMiles = 0
  const totalMiles = recent.reduce((s, a) => s + metersToMiles(Number(a.distance_m)), 0)

  for (const c of classified) {
    const type = c.classification.type
    byType[type].count += 1
    byType[type].miles += c.miles
    byType[type].avgPace += c.pace
    intensitySum += c.classification.intensity

    if (type === 'easy' || type === 'recovery') easyMiles += c.miles
    else if (type === 'tempo') thresholdMiles += c.miles
    else if (type === 'interval') vo2maxMiles += c.miles
  }

  // Normalize average paces
  for (const type of Object.keys(byType) as RunType[]) {
    if (byType[type].count > 0) {
      byType[type].avgPace /= byType[type].count
    }
  }

  // Estimate VO2 max using a simple Karvonen-style approach
  // Assumes threshold pace ~8:00/mi and scales from there
  const thresholdPace = 480
  const avgIntensityFraction = intensitySum / (classified.length * 100) // 0-1
  const vo2Estimate = 40 + avgIntensityFraction * 20 // rough: 40-60 mL/kg/min

  // Marathon pace estimate: use weighted average of recent paces
  // Heavier weight to harder efforts (they indicate fitness better)
  const marathonPaceEstimate =
    avgPace -
    (avgIntensityFraction * avgPace * 0.05) // slight improvement for high intensity
  ;

  const longRuns = classified.filter((c) => c.classification.type === 'long')
  const hardRuns = classified.filter(
    (c) => c.classification.type === 'tempo' || c.classification.type === 'interval',
  )

  return {
    totalRuns: recent.length,
    totalMiles,
    byType,
    avgPace,
    longRuns: {
      count: longRuns.length,
      miles: longRuns.reduce((s, c) => s + c.miles, 0),
    },
    hardRuns: {
      count: hardRuns.length,
      miles: hardRuns.reduce((s, c) => s + c.miles, 0),
    },
    intensityDistribution: {
      easy: (easyMiles / totalMiles) * 100,
      threshold: (thresholdMiles / totalMiles) * 100,
      vo2max: (vo2maxMiles / totalMiles) * 100,
    },
    estimatedVOMax: vo2Estimate,
    estimatedMarathonPace: marathonPaceEstimate,
  }
}

/** Project marathon finish using training analysis metrics. */
export function projectFromTraining(
  analysis: ThirtyDayAnalysis,
  marathonDistance: number = 42195,
): number | null {
  if (analysis.totalRuns === 0) return null

  // Use the estimated marathon pace (seconds per mile) × marathon distance in miles
  const marathonMiles = marathonDistance / 1609.34
  return analysis.estimatedMarathonPace * marathonMiles
}
