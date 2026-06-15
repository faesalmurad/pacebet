const METERS_PER_MILE = 1609.34

/** 14400 -> "4:00:00", 3725 -> "1:02:05" */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const pad = (n: number) => n.toString().padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`
}

/** Parse "4:00:00", "4:00", or "240" (minutes-ish) into seconds. Returns null if unparseable. */
export function parseDuration(input: string): number | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  const parts = trimmed.split(':').map((p) => p.trim())
  if (parts.some((p) => p === '' || isNaN(Number(p)))) return null
  const nums = parts.map(Number)
  if (nums.some((n) => n < 0)) return null
  if (nums.length === 3) return nums[0] * 3600 + nums[1] * 60 + nums[2]
  if (nums.length === 2) return nums[0] * 3600 + nums[1] * 60
  if (nums.length === 1) return nums[0] * 60 // bare number = minutes
  return null
}

export function metersToMiles(m: number): number {
  return m / METERS_PER_MILE
}

export function formatMiles(m: number, digits = 1): string {
  return metersToMiles(m).toFixed(digits)
}

/** pace in seconds per mile -> "8:32/mi" */
export function formatPace(secondsPerMile: number): string {
  return `${formatDuration(secondsPerMile)}/mi`
}

/** seconds per mile for a run */
export function paceSecPerMile(distance_m: number, moving_time_s: number): number {
  const miles = metersToMiles(distance_m)
  return miles > 0 ? moving_time_s / miles : 0
}

const SHORT_DATE = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })
const FULL_DATE = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
})

/** Parse a YYYY-MM-DD as a local date (avoids UTC off-by-one). */
export function localDate(iso: string): Date {
  const [y, m, d] = iso.split('T')[0].split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function formatShortDate(iso: string): string {
  return SHORT_DATE.format(localDate(iso))
}

export function formatFullDate(iso: string): string {
  return FULL_DATE.format(localDate(iso))
}

/** Whole days from today (local) until the given ISO date. Negative if past. */
export function daysUntil(iso: string, now = new Date()): number {
  const target = localDate(iso)
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((target.getTime() - start.getTime()) / 86_400_000)
}

/** "3h ago", "2d ago", "just now" from an ISO timestamp. */
export function timeAgo(iso: string, now = new Date()): string {
  const diff = now.getTime() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return formatShortDate(iso)
}
