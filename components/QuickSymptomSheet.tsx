'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { Input } from '@/components/ui/input'
import { VocaButton } from '@/components/ui/voca-card'
import type { SymptomExtraction } from '@/lib/types'

const BODY_AREAS = [
  'Head', 'Eyes', 'Neck', 'Shoulders', 'Back', 'Chest',
  'Stomach', 'Hips', 'Knees', 'Ankles', 'Feet', 'Hands',
  'General fatigue', 'Mood', 'Other',
]

interface Props {
  open: boolean
  onClose: () => void
}

export function QuickSymptomSheet({ open, onClose }: Props) {
  const [area, setArea] = useState<string | null>(null)
  const [customArea, setCustomArea] = useState('')
  const [severity, setSeverity] = useState(5)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const effectiveArea = area === 'Other' ? customArea : area

  const handleSave = async () => {
    if (!effectiveArea) { toast.error('Pick a body area first'); return }
    setSaving(true)

    const raw_transcript = `Quick log: ${effectiveArea}, severity ${severity}${note ? `, note: ${note}` : ''}`
    const data: SymptomExtraction = {
      symptoms: [{
        name: effectiveArea.toLowerCase(),
        location: effectiveArea.toLowerCase(),
        severity,
        severity_source: 'explicit',
        quality: null,
      }],
      factors: [],
      mood: area === 'Mood' ? effectiveArea.toLowerCase() : null,
      notes: note || null,
      ambiguities: [],
      raw_transcript,
    }

    try {
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'symptom', data, transcript: raw_transcript }),
      })
      const result = await res.json()
      if (!res.ok) { toast.error(result.error ?? 'Failed to save'); setSaving(false); return }
      toast.success('Saved!')
      onClose()
    } catch {
      toast.error('Network error')
      setSaving(false)
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Quick symptom">
      <div className="flex flex-col gap-6 px-container-padding-mobile py-4 pb-8">

        {/* Body area pills — horizontal scroll */}
        <div>
          <p className="text-label-sm font-medium text-on-surface-variant uppercase tracking-wider mb-3">
            Where does it hurt?
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
            {BODY_AREAS.map((a) => (
              <button
                key={a}
                onClick={() => setArea(a)}
                className={[
                  'shrink-0 rounded-full px-4 py-2 text-label-md font-medium transition-all tap-response',
                  area === a
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-variant text-on-surface-variant hover:bg-surface-variant/80',
                ].join(' ')}
              >
                {a}
              </button>
            ))}
          </div>
          {area === 'Other' && (
            <Input
              className="mt-3"
              value={customArea}
              onChange={(e) => setCustomArea(e.target.value)}
              placeholder="Describe the area…"
              autoFocus
            />
          )}
        </div>

        {/* Severity — huge number + gradient slider */}
        <div>
          <p className="text-label-sm font-medium text-on-surface-variant uppercase tracking-wider mb-2">
            Severity
          </p>
          <div className="text-center mb-3">
            <span className="text-display-lg-mobile font-bold tabular-nums text-on-surface">
              {severity}
            </span>
            <span className="text-headline-md text-on-surface-variant">/10</span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            value={severity}
            onChange={(e) => setSeverity(Number(e.target.value))}
            className="w-full severity-gradient"
          />
          <div className="flex justify-between mt-1.5">
            <span className="text-caption text-on-surface-variant">Mild</span>
            <span className="text-caption text-on-surface-variant">Severe</span>
          </div>
        </div>

        {/* Note — borderless */}
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Anything else? (optional)"
          rows={2}
          className="w-full bg-transparent border-0 border-b border-outline-variant rounded-none px-0 py-2 text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary resize-none transition-colors"
        />

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <VocaButton variant="primary" onClick={handleSave} disabled={saving || !effectiveArea} className="w-full">
            {saving ? 'Saving…' : 'Save'}
          </VocaButton>
          <VocaButton variant="ghost" onClick={onClose} disabled={saving} className="w-full">
            Cancel
          </VocaButton>
        </div>
      </div>
    </BottomSheet>
  )
}
