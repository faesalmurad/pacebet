'use client'

import { useState } from 'react'

export function PredictionTooltip() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setIsOpen(false)}>
          <div
            className="bg-ink border border-volt/30 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 text-xs text-bone/80"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-2xl">How We Predict</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-muted hover:text-bone transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <p className="font-semibold text-volt mb-2">Riegel Formula</p>
                <p className="font-mono text-[0.75rem] bg-ink-3/50 p-3 rounded mb-2 border border-volt/20">
                  T₂ = T₁ × (D₂/D₁)^1.06
                </p>
                <p className="leading-relaxed">
                  We take your longest run time and scale it to marathon distance. The 1.06 exponent (the empirical exponent
                  for running) accounts for fatigue accumulation—longer distances are disproportionately harder than shorter ones.
                </p>
              </div>

              <div>
                <p className="font-semibold text-volt mb-2">30-Day Training Intensity</p>
                <p className="leading-relaxed mb-2">
                  Runs are classified by type and weighted by their contribution to fitness:
                </p>
                <div className="bg-ink-3/50 p-3 rounded border border-volt/20 space-y-1.5 font-mono text-[0.7rem] mb-2">
                  <div className="flex justify-between">
                    <span>Easy runs</span>
                    <span className="text-volt">50%</span>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span className="text-[0.65rem]">baseline aerobic work, builds foundation</span>
                  </div>
                  <div className="h-px bg-line my-1" />

                  <div className="flex justify-between">
                    <span>Long runs</span>
                    <span className="text-volt">35%</span>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span className="text-[0.65rem]">distance tolerance, teaches pace sustainability</span>
                  </div>
                  <div className="h-px bg-line my-1" />

                  <div className="flex justify-between">
                    <span>Tempo runs</span>
                    <span className="text-volt">70%</span>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span className="text-[0.65rem]">lactate threshold, race-effort rehearsal</span>
                  </div>
                  <div className="h-px bg-line my-1" />

                  <div className="flex justify-between">
                    <span>Intervals</span>
                    <span className="text-volt">90%</span>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span className="text-[0.65rem]">VO2 max, fitness ceiling gains</span>
                  </div>
                </div>

                <p className="leading-relaxed">
                  <span className="text-volt font-semibold">Formula:</span> (Σ miles × intensity weight) ÷ 30 days = estimated weekly
                  stress. This rolling 30-day weighted average responds to how you've actually trained, not just raw mileage.
                </p>
              </div>

              <div>
                <p className="font-semibold text-volt mb-2">Why Two Estimates?</p>
                <p className="leading-relaxed">
                  <span className="text-volt">Riegel</span> is stable and doesn't overreact, but lags behind fitness improvements
                  by weeks. <span className="text-volt">Training analysis</span> responds faster to intensity spikes, but can be
                  optimistic without the grounding of long-run data.
                </p>
                <p className="leading-relaxed mt-2">
                  We show both and use their <span className="font-semibold">midpoint</span> as the official projection—a balanced
                  estimate that accounts for both stability and responsiveness.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="w-full mt-6 py-2 bg-volt/10 hover:bg-volt/20 border border-volt/30 rounded text-volt text-sm font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  )
}
