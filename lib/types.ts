export type Pick = 'over' | 'under' | 'target_time'

export interface Race {
  id: string
  slug: string
  runner_name: string
  race_name: string
  race_date: string // ISO date (YYYY-MM-DD)
  line_seconds: number // the over/under line for finish time
  actual_seconds: number | null // null until settled
  settled: boolean
  created_at: string
}

export interface Bet {
  id: string
  race_id: string
  bettor_name: string
  pick: Pick
  stake: number
  note: string | null
  predicted_seconds: number | null
  accuracy_margin: number | null
  target_seconds: number | null
  status: 'pending' | 'live'
  created_at: string
}

export interface Activity {
  id: string
  race_id: string | null
  activity_date: string // ISO date
  name: string
  distance_m: number
  moving_time_s: number
  source: string // 'mock' for now, 'strava' once wired up
  external_id: string | null
  created_at: string
}
