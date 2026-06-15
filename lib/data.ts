import { supabasePublic } from './supabase'
import type { Activity, Bet, Race } from './types'

export const RACE_SLUG = process.env.NEXT_PUBLIC_RACE_SLUG || 'nyc-2026'

export async function getRace(slug: string = RACE_SLUG): Promise<Race | null> {
  const { data, error } = await supabasePublic()
    .from('wager_races')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()
  if (error) throw error
  return data as Race | null
}

export async function getActivities(raceId: string): Promise<Activity[]> {
  const { data, error } = await supabasePublic()
    .from('wager_activities')
    .select('*')
    .eq('race_id', raceId)
    .order('activity_date', { ascending: true })
  if (error) throw error
  return (data ?? []) as Activity[]
}

export async function getBets(raceId: string): Promise<Bet[]> {
  const { data, error } = await supabasePublic()
    .from('wager_bets')
    .select('*')
    .eq('race_id', raceId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Bet[]
}
