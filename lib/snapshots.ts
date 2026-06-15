import { supabaseAdmin } from './supabase'
import type { Projection } from './stats'

/**
 * Record today's projection snapshot for the history chart.
 * Idempotent: if a snapshot for today already exists, it updates.
 */
export async function saveProjectionSnapshot(
  raceId: string,
  projection: Projection,
  basisActivityId?: string,
  today = new Date(),
): Promise<void> {
  const dateStr = today.toISOString().split('T')[0]

  const { error } = await supabaseAdmin()
    .from('wager_projection_snapshots')
    .upsert(
      {
        race_id: raceId,
        snapshot_date: dateStr,
        projected_seconds: projection.seconds,
        basis_activity_id: basisActivityId ?? null,
      },
      { onConflict: 'race_id,snapshot_date' },
    )

  if (error) {
    throw new Error(`Failed to save projection snapshot: ${error.message}`)
  }
}

export interface SnapshotRow {
  snapshot_date: string
  projected_seconds: number | null
}

/**
 * Fetch projection history for the last N days.
 */
export async function getProjectionHistory(raceId: string, days = 90): Promise<SnapshotRow[]> {
  const { data, error } = await supabaseAdmin()
    .from('wager_projection_snapshots')
    .select('snapshot_date, projected_seconds')
    .eq('race_id', raceId)
    .gte('snapshot_date', new Date(Date.now() - days * 86_400_000).toISOString().split('T')[0])
    .order('snapshot_date', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch projection history: ${error.message}`)
  }

  return (data ?? []) as SnapshotRow[]
}
