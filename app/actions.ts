'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { supabaseAdmin, supabasePublic } from '@/lib/supabase'
import { getRace, RACE_SLUG, getBets } from '@/lib/data'
import { parseDuration, formatDuration } from '@/lib/format'

export interface ActionState {
  ok: boolean
  error?: string
  message?: string
}

function revalidateAll() {
  revalidatePath('/')
  revalidatePath('/bets')
  revalidatePath('/settle')
}

function parseDurationString(input: string): number | null {
  const parts = input.split(':').map((p) => p.trim())
  if (parts.length !== 3) return null
  const [h, m, s] = parts.map(Number)
  if (isNaN(h) || isNaN(m) || isNaN(s) || m >= 60 || s >= 60) return null
  return h * 3600 + m * 60 + s
}

const betSchema = z.object({
  bettor_name: z.string().trim().min(1, 'Add your name').max(40, 'Name too long'),
  pick: z.enum(['over', 'under']),
  target_time: z.string(),
  stake: z.coerce.number().min(0, 'Stake must be 0 or more').max(100000).default(0),
  note: z.string().trim().max(280, 'Keep notes under 280 chars').optional(),
})

export async function placeBet(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = betSchema.safeParse({
    bettor_name: formData.get('bettor_name'),
    pick: formData.get('pick'),
    target_time: formData.get('target_time'),
    stake: formData.get('stake') || 0,
    note: formData.get('note') || undefined,
  })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid bet' }
  }

  const race = await getRace(RACE_SLUG)
  if (!race) return { ok: false, error: 'Race not found' }
  if (race.settled) return { ok: false, error: 'This race is already settled — betting is closed.' }

  const targetSeconds = parseDurationString(parsed.data.target_time)
  if (targetSeconds === null) return { ok: false, error: 'Enter time as H:MM:SS or HH:MM:SS' }

  const { error } = await supabasePublic()
    .from('wager_bets')
    .insert({
      race_id: race.id,
      bettor_name: parsed.data.bettor_name,
      pick: parsed.data.pick,
      stake: parsed.data.stake,
      note: parsed.data.note ?? null,
      target_seconds: targetSeconds,
      status: 'pending',
    })
  if (error) return { ok: false, error: error.message }

  revalidateAll()
  return { ok: true, message: `${parsed.data.pick.toUpperCase()} ${formatDuration(targetSeconds)} (pending approval)` }
}

export async function approveBet(formData: FormData): Promise<void> {
  if (!checkPass(formData)) return

  const betId = String(formData.get('bet_id') ?? '')
  if (!betId) return

  const { error } = await supabaseAdmin()
    .from('wager_bets')
    .update({ status: 'live' })
    .eq('id', betId)

  revalidateAll()
}

function checkPass(formData: FormData): boolean {
  const supplied = String(formData.get('passphrase') ?? '')
  const expected = process.env.SETTLE_PASSPHRASE || 'letsgo'
  return supplied === expected
}

export async function settleRace(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!checkPass(formData)) return { ok: false, error: 'Wrong passphrase' }

  const seconds = parseDuration(String(formData.get('finish_time') ?? ''))
  if (seconds === null || seconds <= 0) {
    return { ok: false, error: 'Enter a finish time like 3:58:21' }
  }

  const race = await getRace(RACE_SLUG)
  if (!race) return { ok: false, error: 'Race not found' }

  // Fetch all bets to check for winners
  const bets = await getBets(race.id)

  // Determine winners: over/under vs line, and closest target_time
  let closestTargetBet: string | null = null
  let closestMargin = Infinity

  for (const b of bets) {
    if (b.pick === 'target_time' && b.target_seconds) {
      const margin = Math.abs(seconds - b.target_seconds)
      if (margin < closestMargin) {
        closestMargin = margin
        closestTargetBet = b.id
      }
    }
  }

  const { error } = await supabaseAdmin()
    .from('wager_races')
    .update({ actual_seconds: seconds, settled: true })
    .eq('id', race.id)
  if (error) return { ok: false, error: error.message }

  revalidateAll()
  return {
    ok: true,
    message: `Race settled at ${formatDuration(seconds)} — results are in!`,
  }
}

export async function reopenRace(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!checkPass(formData)) return { ok: false, error: 'Wrong passphrase' }
  const race = await getRace(RACE_SLUG)
  if (!race) return { ok: false, error: 'Race not found' }

  const { error } = await supabaseAdmin()
    .from('wager_races')
    .update({ actual_seconds: null, settled: false })
    .eq('id', race.id)
  if (error) return { ok: false, error: error.message }

  revalidateAll()
  return { ok: true, message: 'Race reopened — betting is live again.' }
}

const settingsSchema = z.object({
  runner_name: z.string().trim().min(1).max(60),
  race_name: z.string().trim().min(1).max(120),
  race_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
})

export async function deleteBet(formData: FormData): Promise<void> {
  const betId = String(formData.get('bet_id') ?? '')
  if (!betId) return

  const { error } = await supabaseAdmin()
    .from('wager_bets')
    .delete()
    .eq('id', betId)

  if (error) {
    console.error('Delete bet error:', error)
    return
  }

  revalidateAll()
}

export async function updateSettings(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!checkPass(formData)) return { ok: false, error: 'Wrong passphrase' }

  const lineSeconds = parseDuration(String(formData.get('line') ?? ''))
  if (lineSeconds === null || lineSeconds <= 0) {
    return { ok: false, error: 'Enter the over/under line like 4:00:00' }
  }
  const parsed = settingsSchema.safeParse({
    runner_name: formData.get('runner_name'),
    race_name: formData.get('race_name'),
    race_date: formData.get('race_date'),
  })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid settings' }
  }

  const race = await getRace(RACE_SLUG)
  if (!race) return { ok: false, error: 'Race not found' }

  const { error } = await supabaseAdmin()
    .from('wager_races')
    .update({
      runner_name: parsed.data.runner_name,
      race_name: parsed.data.race_name,
      race_date: parsed.data.race_date,
      line_seconds: lineSeconds,
    })
    .eq('id', race.id)
  if (error) return { ok: false, error: error.message }

  revalidateAll()
  return { ok: true, message: 'Settings updated.' }
}
