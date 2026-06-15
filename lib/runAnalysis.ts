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

export interface PaceAnalysis {
  // Pace data
  paces: { date: string; pace: number; miles: number; type: RunType }[]
  recentTrendPaces: number[] // last 7 days paces
  olderTrendPaces: number[] // 8-30 days paces
  trendDirection: 'improving' | 'declining' | 'stable' // pace is getting faster/slower
  fastestSustainablePace: number // critical speed from recent hard efforts
  longRunPace: number // average pace of long runs (race-specific)
  thresholdPace: number // average tempo pace (critical effort)

  // Metadata
  paceConsistency: number // 0-1, how consistent are they running
  recentVolume: number // miles in last 7 days
  volumeTrend: 'increasing' | 'decreasing' | 'stable'
  trainingStress: number // 0-100, how hard they've been training

  // Prediction components
  components: {
    thresholdBased: number // marathon prediction from threshold pace
    criticalSpeedBased: number // prediction from critical speed
    longRunBased: number // prediction from long run pace (conservative)
    trendAdjustment: number // adjustment based on improving/declining trend
  }

  finalPrediction: number // actual marathon seconds prediction
}

/** Sophisticated race prediction analyzing recent pace data. */
export function analyzePaceForRacePrediction(
  activities: Activity[],
  marathonDistance: number = 42195,
  now = new Date(),
): PaceAnalysis | null {
  const dayMs = 86_400_000
  const thirtyDaysAgo = new Date(now.getTime() - 30 * dayMs)
  const sevenDaysAgo = new Date(now.getTime() - 7 * dayMs)

  const recent30 = activities.filter((a) => {
    const d = new Date(a.activity_date)
    return d >= thirtyDaysAgo && d <= now
  })

  if (recent30.length === 0) return null

  // Extract pace data with dates
  const paceData = recent30.map((a) => ({
    date: a.activity_date,
    pace: paceSecPerMile(a.distance_m, a.moving_time_s),
    miles: metersToMiles(a.distance_m),
    type: classifyRun(a).type,
  }))

  // Split into recent and older periods
  const recentPaces = paceData.filter((p) => new Date(p.date) >= sevenDaysAgo).map((p) => p.pace)
  const olderPaces = paceData.filter((p) => new Date(p.date) < sevenDaysAgo).map((p) => p.pace)

  // Calculate trend
  const recentAvg = recentPaces.length > 0 ? recentPaces.reduce((a, b) => a + b) / recentPaces.length : 0
  const olderAvg = olderPaces.length > 0 ? olderPaces.reduce((a, b) => a + b) / olderPaces.length : 0
  const trendDiff = olderAvg - recentAvg // positive = faster/improving
  const trendDirection: 'improving' | 'declining' | 'stable' =
    trendDiff > 10 ? 'improving' : trendDiff < -10 ? 'declining' : 'stable'

  // Find fastest sustainable pace (hard efforts: tempo/interval)
  const hardEfforts = paceData.filter((p) => p.type === 'tempo' || p.type === 'interval')
  const fastestSustainable = hardEfforts.length > 0 ? Math.min(...hardEfforts.map((p) => p.pace)) : recentAvg

  // Long run pace
  const longRuns = paceData.filter((p) => p.type === 'long' && p.miles >= 10)
  const longRunPace = longRuns.length > 0 ? longRuns.reduce((s, p) => s + p.pace, 0) / longRuns.length : recentAvg

  // Threshold pace (tempo runs are closest to race effort)
  const tempoRuns = paceData.filter((p) => p.type === 'tempo')
  const thresholdPace = tempoRuns.length > 0 ? tempoRuns.reduce((s, p) => s + p.pace, 0) / tempoRuns.length : fastestSustainable

  // Pace consistency (std dev)
  const allPaces = paceData.map((p) => p.pace)
  const meanPace = allPaces.reduce((a, b) => a + b) / allPaces.length
  const variance = allPaces.reduce((s, p) => s + Math.pow(p - meanPace, 2), 0) / allPaces.length
  const stdDev = Math.sqrt(variance)
  const consistency = Math.max(0, Math.min(1, 1 - stdDev / meanPace)) // 0-1

  // Recent volume
  const recentVolume = paceData
    .filter((p) => new Date(p.date) >= sevenDaysAgo)
    .reduce((s, p) => s + p.miles, 0)

  // Volume trend
  const recentVol = paceData.filter((p) => new Date(p.date) >= sevenDaysAgo).reduce((s, p) => s + p.miles, 0)
  const olderVol = paceData.filter((p) => new Date(p.date) < sevenDaysAgo).reduce((s, p) => s + p.miles, 0)
  const volumeTrend: 'increasing' | 'decreasing' | 'stable' =
    recentVol > olderVol * 1.1 ? 'increasing' : recentVol < olderVol * 0.9 ? 'decreasing' : 'stable'

  // Training stress (intensity-weighted volume)
  const stressScore = paceData.reduce((s, p) => {
    const intensity = classifyRun({ distance_m: 0, moving_time_s: 0, name: '', activity_date: '', source: '', id: '', race_id: null, external_id: null, created_at: '' }, p.pace).intensity
    return s + (p.miles * intensity / 100)
  }, 0)
  const trainingStress = Math.min(100, (stressScore / (paceData.length || 1)) * 10)

  // Calculate marathon prediction components
  const marathonMiles = marathonDistance / 1609.34

  // 1. Threshold-based: tempo pace is close to marathon pace, use as base
  const thresholdBased = thresholdPace * marathonMiles * 1.05 // 5% slower than tempo pace for 42.2 miles

  // 2. Critical speed based: fastest sustainable pace, more conservative for marathon
  const criticalSpeedBased = fastestSustainable * marathonMiles * 1.08 // 8% slower

  // 3. Long run based: most conservative estimate from long run pace
  const longRunBased = longRunPace * marathonMiles * 1.02 // only 2% slower (already trained distance)

  // 4. Trend adjustment: if improving, be optimistic; if declining, be conservative
  const trendMultiplier = trendDirection === 'improving' ? 0.98 : trendDirection === 'declining' ? 1.02 : 1.0
  const trendAdjustment = (thresholdBased + criticalSpeedBased) / 2 * (trendMultiplier - 1)

  // Final prediction: weighted average, favoring threshold-based estimate
  const finalPrediction = thresholdBased * 0.45 + criticalSpeedBased * 0.35 + longRunBased * 0.15 + trendAdjustment * 0.05

  return {
    paces: paceData,
    recentTrendPaces: recentPaces,
    olderTrendPaces: olderPaces,
    trendDirection,
    fastestSustainablePace: fastestSustainable,
    longRunPace,
    thresholdPace,
    paceConsistency: consistency,
    recentVolume,
    volumeTrend,
    trainingStress,
    components: {
      thresholdBased,
      criticalSpeedBased,
      longRunBased,
      trendAdjustment,
    },
    finalPrediction,
  }
}
