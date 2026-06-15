'use client'

import { useState } from 'react'

export function SyncStravaButton() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleSync = async () => {
    setLoading(true)
    setMessage(null)

    try {
      const res = await fetch('/api/sync-strava', { method: 'POST' })
      const data = (await res.json()) as { ok?: boolean; synced?: number; error?: string; message?: string }

      if (data.ok) {
        setMessage(`✓ ${data.message}`)
      } else {
        setMessage(`✗ ${data.error || 'Sync failed'}`)
      }
    } catch (e) {
      setMessage(`✗ ${e instanceof Error ? e.message : 'Network error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="panel p-6 space-y-4">
      <p className="eyebrow">Data sync</p>
      <button
        onClick={handleSync}
        disabled={loading}
        className="btn btn-primary w-full"
      >
        {loading ? 'Syncing...' : 'Fetch Strava'}
      </button>
      {message && (
        <p className={`text-sm font-mono ${message.startsWith('✓') ? 'text-volt' : 'text-coral'}`}>
          {message}
        </p>
      )}
    </div>
  )
}
