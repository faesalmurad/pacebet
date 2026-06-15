import { createClient } from '@supabase/supabase-js'

/**
 * Read/insert client using the public anon key. Safe to use anywhere on the
 * server. RLS on the wager_ tables allows public reads + inserting bets.
 *
 * This is a casual friends-only wager site, so there's no user auth and no
 * cookie/session handling — a plain client is all we need.
 */
export function supabasePublic() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

/**
 * Service-role client. SERVER-ONLY — bypasses Row Level Security.
 * Used for privileged mutations (settling the race, editing settings,
 * seeding/syncing activities). Never import this into a Client Component.
 */
export function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}
