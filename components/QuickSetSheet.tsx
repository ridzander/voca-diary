'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { Input } from '@/components/ui/input'
import { VocaButton } from '@/components/ui/voca-card'
import { Icon } from '@/components/ui/ms-icon'
import type { WorkoutExtraction } from '@/lib/types'

interface Props {
  open: boolean
  onClose: () => void
  preselectedExercise?: string
}

export function QuickSetSheet({ open, onClose, preselectedExercise }: Props) {
  const [exercises, setExercises] = useState<string[]>([])
  const [selected, setSelected] = useState(preselectedExercise ?? '')
  const [isNewExercise, setIsNewExercise] = useState(false)
  const [newName, setNewName] = useState('')
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')
  const [rpe, setRpe] = useState<number | null>(null)
  const [setNotes, setSetNotes] = useState('')
  const [showMore, setShowMore] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)

  useEffect(() => {
    if (!open) return
    fetch('/api/exercise-history')
      .then((r) => r.json())
      .then((d) => { if (d.exercises) setExercises(d.exercises) })
      .catch(() => {})
  }, [open])

  const fillLastSet = useCallback(async (name: string) => {
    if (!name) return
    setLoadingHistory(true)
    try {
      const res = await fetch(`/api/exercise-history?name=${encodeURIComponent(name)}`)
      const d = await res.json()
      if (d.last) {
        if (d.last.weight_kg !== null) setWeight(String(d.last.weight_kg))
        if (d.last.reps !== null) setReps(String(d.last.reps))
      }
    } catch {
      // silently ignore — auto-fill is best-effort
    } finally {
      setLoadingHistory(false)
    }
  }, [])

  useEffect(() => {
    if (selected && !isNewExercise) fillLastSet(selected)
  }, [selected, isNewExercise, fillLastSet])

  const effectiveName = isNewExercise ? newName : selected

  const handleSave = async () => {
    if (!effectiveName) { toast.error('Pick an exercise'); return }
    if (!weight || !reps) { toast.error('Weight and reps are required'); return }

    setSaving(true)
    const w = parseFloat(weight)
    const r = parseInt(reps, 10)
    if (isNaN(w) || isNaN(r)) { toast.error('Invalid weight or reps'); setSaving(false); return }

    const rpeStr = rpe !== null ? ` RPE ${rpe}` : ''
    const raw_transcript = `Quick set: ${effectiveName} ${w}kg × ${r}${rpeStr}`

    const data: WorkoutExtraction = {
      session_type: 'lifting',
      session_label: effectiveName,
      activities: [{
        type: 'lifting',
        name: effectiveName,
        sets: [{ reps: r, weight_kg: w, rpe, notes: setNotes || null }],
        duration_minutes: null,
        intensity_notes: null,
        notes: null,
      }],
      session_notes: null,
      perceived_effort: null,
      post_session_symptoms: [],
      ambiguities: ['entry created via Quick Set — single set only'],
      raw_transcript,
    }

    try {
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'workout', data, transcript: raw_transcript }),
      })
      const result = await res.json()
      if (!res.ok) { toast.error(result.error ?? 'Failed to save'); setSaving(false); return }
      toast.success('Set saved!')
      onClose()
    } catch {
      toast.error('Network error')
      setSaving(false)
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Quick set">
      <div className="flex flex-col gap-5 px-container-padding-mobile py-4 pb-8">

        {/* Exercise picker */}
        <div className="flex flex-col gap-1.5">
          <p className="text-label-sm font-medium text-on-surface-variant uppercase tracking-wider">Exercise</p>
          {!isNewExercise ? (
            <select
              value={selected}
              onChange={(e) => {
                const v = e.target.value
                if (v === '__new__') { setIsNewExercise(true); setSelected(''); setWeight(''); setReps('') }
                else { setSelected(v); setWeight(''); setReps('') }
              }}
              className="h-12 w-full rounded-xl border border-outline-variant bg-surface px-4 text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-primary transition-all"
            >
              <option value="">Select exercise…</option>
              {exercises.map((ex) => (
                <option key={ex} value={ex}>{ex}</option>
              ))}
              <option value="__new__">Type a new exercise…</option>
            </select>
          ) : (
            <div className="flex gap-2">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Exercise name"
                autoFocus
                className="flex-1"
              />
              <button
                onClick={() => { setIsNewExercise(false); setNewName('') }}
                className="text-label-md text-on-surface-variant hover:text-on-surface transition-colors px-2"
              >
                ← Back
              </button>
            </div>
          )}
          {loadingHistory && (
            <p className="text-caption text-on-surface-variant">Loading last set…</p>
          )}
        </div>

        {/* Weight + Reps */}
        <div className="flex gap-3">
          <div className="flex flex-col gap-1.5 flex-1">
            <p className="text-label-sm font-medium text-on-surface-variant uppercase tracking-wider">Weight</p>
            <div className="relative">
              <Input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="0"
                inputMode="decimal"
                step={0.5}
                min={0}
                className="pr-9"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-label-md text-on-surface-variant">kg</span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 flex-1">
            <p className="text-label-sm font-medium text-on-surface-variant uppercase tracking-wider">Reps</p>
            <Input
              type="number"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              placeholder="0"
              inputMode="numeric"
              min={0}
            />
          </div>
        </div>

        {/* More options toggle */}
        <button
          onClick={() => setShowMore((v) => !v)}
          className="flex items-center gap-1.5 text-label-md text-on-surface-variant hover:text-on-surface transition-colors self-start"
        >
          <Icon name={showMore ? 'expand_less' : 'expand_more'} size={18} />
          {showMore ? 'Less' : 'More'} options
        </button>

        {showMore && (
          <div className="flex flex-col gap-4 -mt-2">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <p className="text-label-sm font-medium text-on-surface-variant uppercase tracking-wider">
                  RPE {rpe !== null ? `· ${rpe}` : '(optional)'}
                </p>
                {rpe !== null && (
                  <button onClick={() => setRpe(null)} className="text-caption text-on-surface-variant hover:text-on-surface">
                    Clear
                  </button>
                )}
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={rpe ?? 7}
                onChange={(e) => setRpe(Number(e.target.value))}
                onClick={() => { if (rpe === null) setRpe(7) }}
                className="w-full"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="text-label-sm font-medium text-on-surface-variant uppercase tracking-wider">Set notes (optional)</p>
              <Input
                value={setNotes}
                onChange={(e) => setSetNotes(e.target.value)}
                placeholder="e.g. felt easy, last set hard"
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2 pt-1">
          <VocaButton variant="primary" onClick={handleSave} disabled={saving || !effectiveName} className="w-full">
            {saving ? 'Saving…' : 'Save set'}
          </VocaButton>
          <VocaButton variant="ghost" onClick={onClose} disabled={saving} className="w-full">
            Cancel
          </VocaButton>
        </div>
      </div>
    </BottomSheet>
  )
}
