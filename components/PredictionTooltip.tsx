'use client'

import { useState } from 'react'

export function PredictionTooltip() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1 text-volt hover:text-volt/80 transition-colors cursor-help"
      >
        <span className="text-sm">How we predict</span>
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-80 bg-ink border border-volt/30 rounded-lg shadow-lg p-4 z-50 text-xs text-bone/80">
          <div className="space-y-3">
            <div>
              <p className="font-semibold text-volt mb-1">Riegel Formula</p>
              <p className="font-mono text-[0.7rem] bg-ink-3/50 p-2 rounded mb-1">T₂ = T₁ × (D₂/D₁)^1.06</p>
              <p>
                We take your longest run and scale it to marathon distance. The 1.06 exponent accounts for
                fatigue accumulation over longer distances.
              </p>
            </div>

            <div>
              <p className="font-semibold text-volt mb-1">30-Day Training Intensity</p>
              <p className="mb-2">
                Runs are classified by type (easy, long, tempo, interval, recovery) and weighted by intensity:
              </p>
              <ul className="space-y-1 ml-3">
                <li>
                  <span className="font-mono">Easy: 50%</span> — baseline aerobic work
                </li>
                <li>
                  <span className="font-mono">Long: 35%</span> — distance tolerance
                </li>
                <li>
                  <span className="font-mono">Tempo: 70%</span> — lactate threshold
                </li>
                <li>
                  <span className="font-mono">Interval: 90%</span> — VO2 max peak
                </li>
              </ul>
              <p className="mt-2">
                Final score = (Σ miles × intensity weight) / 30 days. This estimates sustainable marathon pace based on recent
                effort distribution.
              </p>
            </div>

            <div>
              <p className="font-semibold text-volt mb-1">Why Two Estimates?</p>
              <p>
                Riegel is stable but lags improvements. Training analysis responds faster to intensity changes. We show both
                and use their midpoint for the official projection.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
