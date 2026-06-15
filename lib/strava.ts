/**
 * Strava integration seam.
 *
 * Right now the dashboard reads training runs from the `wager_activities`
 * table, which is seeded with realistic mock data. When you're ready to wire
 * up real Strava, you do NOT need to touch any UI: just populate that same
 * table from Strava and the whole app updates automatically.
 *
 * The plan to go live (kept here so it's documented in one place):
 *
 *   1. Create a Strava API application at https://www.strava.com/settings/api
 *      and set these env vars:
 *        STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, STRAVA_REFRESH_TOKEN
 *      (Do the one-time OAuth authorize+token exchange to get a refresh token
 *      with the `activity:read_all` scope.)
 *
 *   2. Implement `fetchStravaRuns()` below to:
 *        - exchange the refresh token for a short-lived access token
 *          (POST https://www.strava.com/oauth/token)
 *        - GET https://www.strava.com/api/v3/athlete/activities?per_page=100
 *        - keep only runs (type === 'Run')
 *
 *   3. Upsert them into `wager_activities` keyed on (external_id, source),
 *      mapping: distance -> distance_m, moving_time -> moving_time_s,
 *      start_date_local -> activity_date, name -> name, source = 'strava'.
 *
 *   4. Trigger `syncStrava()` from a cron/route handler (e.g. hourly) so the
 *      board stays fresh.
 *
 * Until those env vars exist, isStravaConfigured() returns false and the app
 * stays on mock data.
 */

export function isStravaConfigured(): boolean {
  return Boolean(
    process.env.STRAVA_CLIENT_ID &&
      process.env.STRAVA_CLIENT_SECRET &&
      process.env.STRAVA_REFRESH_TOKEN,
  )
}

export interface NormalizedRun {
  external_id: string
  activity_date: string // YYYY-MM-DD
  name: string
  distance_m: number
  moving_time_s: number
  splits?: Array<{ distance_m: number; time_s: number; pace_sec_per_mile: number }>
  peak_pace_sec_per_mile?: number
  avg_pace_sec_per_mile?: number
}

export async function fetchStravaRuns(): Promise<NormalizedRun[]> {
  if (!isStravaConfigured()) {
    throw new Error('Strava not configured (missing env vars)')
  }

  // Exchange refresh token for a fresh access token
  const tokenRes = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      refresh_token: process.env.STRAVA_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  })
  if (!tokenRes.ok) {
    throw new Error(`Strava token exchange failed: ${tokenRes.status}`)
  }
  const { access_token } = (await tokenRes.json()) as { access_token: string }

  // Fetch all activities (paginate if needed, but 100 should cover a marathon cycle)
  const activitiesRes = await fetch(
    'https://www.strava.com/api/v3/athlete/activities?per_page=100',
    {
      headers: { Authorization: `Bearer ${access_token}` },
    },
  )
  if (!activitiesRes.ok) {
    throw new Error(`Strava activities fetch failed: ${activitiesRes.status}`)
  }
  const activities = (await activitiesRes.json()) as any[]

  // Filter to runs and fetch detailed streams for each
  const runs: NormalizedRun[] = []
  const METERS_PER_MILE = 1609.34

  for (const a of activities.filter((x) => x.type === 'Run')) {
    const normalized: NormalizedRun = {
      external_id: a.id.toString(),
      activity_date: a.start_date_local.split('T')[0],
      name: a.name,
      distance_m: Math.round(a.distance),
      moving_time_s: Math.round(a.moving_time),
    }

    // Fetch streams for pace/split data (non-critical, silent fail)
    try {
      const streamRes = await fetch(
        `https://www.strava.com/api/v3/activities/${a.id}/streams?keys=distance,velocity_smooth&key_by_type=true`,
        {
          headers: { Authorization: `Bearer ${access_token}` },
        },
      )
      if (streamRes.ok) {
        const streams = (await streamRes.json()) as any
        if (streams.distance?.data && streams.velocity_smooth?.data) {
          const distances = streams.distance.data as number[]
          const velocities = streams.velocity_smooth.data as number[]

          // Calculate pace data from streams
          const paces = velocities.map((v) => (v > 0 ? METERS_PER_MILE / v : Infinity))
          const validPaces = paces.filter((p) => isFinite(p))

          if (validPaces.length > 0) {
            normalized.peak_pace_sec_per_mile = Math.min(...validPaces)
            normalized.avg_pace_sec_per_mile =
              validPaces.reduce((a, b) => a + b, 0) / validPaces.length
          }
        }
      }
    } catch {
      // Silently skip stream errors
    }

    runs.push(normalized)
  }

  return runs
}
