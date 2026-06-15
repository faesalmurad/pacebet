import { NextResponse } from 'next/server'
import { fetchStravaRuns } from '@/lib/strava'
import { getRace, getActivities, RACE_SLUG } from '@/lib/data'
import { supabaseAdmin } from '@/lib/supabase'
import { projectFinish } from '@/lib/stats'
import { saveProjectionSnapshot } from '@/lib/snapshots'

export const dynamic = 'force-dynamic'

/**
 * POST /api/sync-strava
 *
 * Fetches the latest runs from Strava and upserts them into wager_activities.
 * Keyed by (race_id, external_id, source), so multiple runs with the same
 * external_id will update in-place (e.g. if Strava details change).
 */
export async function POST() {
  try {
    const race = await getRace(RACE_SLUG)
    if (!race) {
      return NextResponse.json({ error: 'Race not found' }, { status: 404 })
    }

    const runs = await fetchStravaRuns()

    // Upsert each run into wager_activities
    for (const run of runs) {
      const { error } = await supabaseAdmin()
        .from('wager_activities')
        .upsert(
          {
            race_id: race.id,
            activity_date: run.activity_date,
            name: run.name,
            distance_m: run.distance_m,
            moving_time_s: run.moving_time_s,
            source: 'strava',
            external_id: run.external_id,
          },
          {
            onConflict: 'race_id,external_id,source',
          },
        )
      if (error) {
        throw new Error(`Upsert failed for run ${run.external_id}: ${error.message}`)
      }
    }

    // Save today's projection snapshot for the history chart
    const activities = await getActivities(race.id)
    const projection = projectFinish(activities, race)
    await saveProjectionSnapshot(race.id, projection)

    return NextResponse.json({
      ok: true,
      synced: runs.length,
      message: `Synced ${runs.length} Strava run${runs.length === 1 ? '' : 's'}`,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
