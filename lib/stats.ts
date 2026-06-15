import type { Activity, Bet, Race } from './types'
import { localDate, metersToMiles, paceSecPerMile } from './format'

export const MARATHON_M = 42195

/** Monday (local) of the week containing `d`. */
export function mondayOf(d: Date): Date {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const dow = (date.getDay() + 6) % 7 // 0 = Monday
  date.setDate(date.getDate() - dow)
  return date
}

export interface WeekBucket {
  weekStart: Date
  miles: number
  isCurrent: boolean
}

/** Miles per week for the last `weeks` weeks, oldest first. */
export function weeklyMileage(activities: Activity[], weeks = 12, now = new Date()): WeekBucket[] {
  const thisMonday = mondayOf(now)
  const buckets: WeekBucket[] = []
  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = new Date(thisMonday)
    weekStart.setDate(weekStart.getDate() - i * 7)
    buckets.push({ weekStart, miles: 0, isCurrent: i === 0 })
  }
  const indexByTime = new Map(buckets.map((b, i) => [b.weekStart.getTime(), i]))
  for (const a of activities) {
    const key = mondayOf(localDate(a.activity_date)).getTime()
    const idx = indexByTime.get(key)
    if (idx !== undefined) buckets[idx].miles += metersToMiles(a.distance_m)
  }
  return buckets
}

export interface TrainingSummary {
  totalRuns: number
  totalMiles: number
  longestRunMiles: number
  last7Miles: number
  prev7Miles: number
  avgPaceSecPerMile: number // weighted by distance, recent 28 days
  weeks: WeekBucket[]
}

export function summarize(activities: Activity[], now = new Date()): TrainingSummary {
  const totalMeters = activities.reduce((s, a) => s + a.distance_m, 0)
  const longest = activities.reduce((m, a) => Math.max(m, a.distance_m), 0)

  const dayMs = 86_400_000
  const within = (a: Activity, days: number) =>
    now.getTime() - localDate(a.activity_date).getTime() <= days * dayMs &&
    localDate(a.activity_date).getTime() <= now.getTime()

  const last7 = activities.filter((a) => within(a, 7))
  const prev7 = activities.filter(
    (a) =>
      now.getTime() - localDate(a.activity_date).getTime() > 7 * dayMs &&
      now.getTime() - localDate(a.activity_date).getTime() <= 14 * dayMs,
  )
  const recent = activities.filter((a) => within(a, 28))
  const recentMeters = recent.reduce((s, a) => s + a.distance_m, 0)
  const recentTime = recent.reduce((s, a) => s + a.moving_time_s, 0)

  return {
    totalRuns: activities.length,
    totalMiles: metersToMiles(totalMeters),
    longestRunMiles: metersToMiles(longest),
    last7Miles: last7.reduce((s, a) => s + metersToMiles(a.distance_m), 0),
    prev7Miles: prev7.reduce((s, a) => s + metersToMiles(a.distance_m), 0),
    avgPaceSecPerMile: recentMeters > 0 ? paceSecPerMile(recentMeters, recentTime) : 0,
    weeks: weeklyMileage(activities, 12, now),
  }
}

export interface Projection {
  seconds: number | null // predicted marathon finish
  side: 'over' | 'under' | null // relative to the line
  marginSeconds: number // line - projected (positive => projected under the line)
  basisMiles: number // distance of the run used as the predictor
}

/**
 * Predict marathon finish from training using Riegel's endurance formula:
 *   T2 = T1 * (D2 / D1) ^ 1.06
 * We use the longest run in the last 35 days as the most representative
 * endurance effort (falling back to the longest run overall).
 */
export function projectFinish(
  activities: Activity[],
  race: Pick<Race, 'line_seconds'>,
  now = new Date(),
): Projection {
  const dayMs = 86_400_000
  const recent = activities.filter(
    (a) => now.getTime() - localDate(a.activity_date).getTime() <= 35 * dayMs,
  )
  const pool = recent.length ? recent : activities
  const predictor = pool.reduce<Activity | null>(
    (best, a) => (!best || a.distance_m > best.distance_m ? a : best),
    null,
  )
  if (!predictor || predictor.distance_m < 5000) {
    return { seconds: null, side: null, marginSeconds: 0, basisMiles: 0 }
  }
  const predicted =
    predictor.moving_time_s * Math.pow(MARATHON_M / predictor.distance_m, 1.06)
  const margin = race.line_seconds - predicted
  return {
    seconds: Math.round(predicted),
    side: predicted <= race.line_seconds ? 'under' : 'over',
    marginSeconds: Math.round(margin),
    basisMiles: metersToMiles(predictor.distance_m),
  }
}

export interface BetTally {
  under: { count: number; stake: number }
  over: { count: number; stake: number }
  totalPot: number
}

export function tallyBets(bets: Bet[]): BetTally {
  const t: BetTally = {
    under: { count: 0, stake: 0 },
    over: { count: 0, stake: 0 },
    totalPot: 0,
  }
  for (const b of bets) {
    if (b.pick === 'over' || b.pick === 'under') {
      t[b.pick].count += 1
      t[b.pick].stake += Number(b.stake) || 0
    }
    t.totalPot += Number(b.stake) || 0
  }
  return t
}
