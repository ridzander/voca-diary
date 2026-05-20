'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Icon } from '@/components/ui/ms-icon'
import { Input } from '@/components/ui/input'
import { AlertDialog } from '@/components/ui/alert-dialog'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { VocaButton } from '@/components/ui/voca-card'
import type { LiveSessionState, LiveActivity, LiveSet, WorkoutExtraction } from '@/lib/types'
import { LIVE_SESSION_STORAGE_KEY } from '@/lib/types'

function newId() {
  return Math.random().toString(36).slice(2, 10)
}

function blankSet(prefill?: Partial<LiveSet>): LiveSet {
  return { reps: prefill?.reps ?? null, weight_kg: prefill?.weight_kg ?? null, rpe: null, notes: null }
}

function blankActivity(name: string): LiveActivity {
  return { id: newId(), name, sets: [] }
}

function emptySession(): LiveSessionState {
  return { startedAt: new Date().toISOString(), activities: [], sessionNotes: '', perceivedEffort: null }
}

function elapsed(startedAt: string): string {
  const secs = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)
  const m = Math.floor(secs / 60).toString().padStart(2, '0')
  const s = (secs % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function hasEnoughData(session: LiveSessionState): boolean {
  return session.activities.some((a) => a.sets.length > 0)
}

const FOUR_HOURS = 4 * 60 * 60 * 1000

// ── Set Row ───────────────────────────────────────────────────────────────────

function SetRow({ set, index, onChange, onDelete }: {
  set: LiveSet
  index: number
  onChange: (patch: Partial<LiveSet>) => void
  onDelete: () => void
}) {
  return (
    <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-2 items-center font-mono">
      <span className="text-caption text-on-surface-variant w-5 text-right">{index + 1}</span>
      <Input
        type="number"
        value={set.reps ?? ''}
        onChange={(e) => onChange({ reps: e.target.value === '' ? null : Number(e.target.value) })}
        placeholder="Reps"
        inputMode="numeric"
        min={0}
        className="h-9 text-caption text-center px-2 font-mono"
      />
      <div className="relative">
        <Input
          type="number"
          value={set.weight_kg ?? ''}
          onChange={(e) => onChange({ weight_kg: e.target.value === '' ? null : Number(e.target.value) })}
          placeholder="kg"
          inputMode="decimal"
          step={0.5}
          min={0}
          className="h-9 text-caption text-center px-2 pr-7 font-mono"
        />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-label-sm text-on-surface-variant">kg</span>
      </div>
      <button onClick={onDelete} className="text-on-surface-variant hover:text-error transition-colors p-1">
        <Icon name="close" size={16} />
      </button>
    </div>
  )
}

// ── Inline Add-Set form ───────────────────────────────────────────────────────

function AddSetForm({ lastSet, onAdd, onCancel }: {
  lastSet: LiveSet | null
  onAdd: (set: LiveSet) => void
  onCancel: () => void
}) {
  const [reps, setReps] = useState(lastSet?.reps !== null ? String(lastSet?.reps ?? '') : '')
  const [weight, setWeight] = useState(lastSet?.weight_kg !== null ? String(lastSet?.weight_kg ?? '') : '')
  const repsRef = useRef<HTMLInputElement>(null)

  useEffect(() => { repsRef.current?.focus() }, [])

  return (
    <div className="flex flex-col gap-2 pt-3 border-t border-outline-variant">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-label-sm text-on-surface-variant mb-1">Reps</p>
          <Input
            ref={repsRef}
            type="number"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            inputMode="numeric"
            min={0}
            placeholder="0"
            className="h-12 text-body-lg text-center font-mono font-semibold"
          />
        </div>
        <div>
          <p className="text-label-sm text-on-surface-variant mb-1">Weight (kg)</p>
          <Input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            inputMode="decimal"
            step={0.5}
            min={0}
            placeholder="0"
            className="h-12 text-body-lg text-center font-mono font-semibold"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <VocaButton
          variant="primary"
          onClick={() => {
            const r = reps === '' ? null : Number(reps)
            const w = weight === '' ? null : Number(weight)
            onAdd({ reps: r, weight_kg: w, rpe: null, notes: null })
          }}
          className="flex-1"
        >
          Save set
        </VocaButton>
        <button onClick={onCancel} className="flex items-center justify-center w-12 h-12 rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors">
          <Icon name="close" size={20} />
        </button>
      </div>
    </div>
  )
}

// ── Add Exercise Sheet ────────────────────────────────────────────────────────

function AddExerciseSheet({ open, onClose, onAdd }: {
  open: boolean
  onClose: () => void
  onAdd: (name: string) => void
}) {
  const [exercises, setExercises] = useState<string[]>([])
  const [selected, setSelected] = useState('')
  const [isNew, setIsNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [loadingHistory, setLoadingHistory] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoadingHistory(true)
    fetch('/api/exercise-history')
      .then((r) => r.json())
      .then((d) => { if (d.exercises) setExercises(d.exercises) })
      .catch(() => {})
      .finally(() => setLoadingHistory(false))
  }, [open])

  const effectiveName = isNew ? newName : selected
  const handleAdd = () => {
    if (!effectiveName.trim()) return
    onAdd(effectiveName.trim())
    onClose()
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Add exercise">
      <div className="flex flex-col gap-4 px-container-padding-mobile py-4 pb-8">
        {!isNew ? (
          <select
            value={selected}
            onChange={(e) => {
              if (e.target.value === '__new__') { setIsNew(true); setSelected('') }
              else setSelected(e.target.value)
            }}
            className="h-12 w-full rounded-xl border border-outline-variant bg-surface px-4 text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-primary transition-all"
          >
            <option value="">Select exercise…</option>
            {exercises.map((ex) => <option key={ex} value={ex}>{ex}</option>)}
            <option value="__new__">Type a new exercise…</option>
          </select>
        ) : (
          <div className="flex gap-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Exercise name"
              autoFocus
              className="flex-1 h-12 text-body-md"
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
            />
            <button onClick={() => { setIsNew(false); setNewName('') }} className="text-label-md text-on-surface-variant px-2 hover:text-on-surface transition-colors">
              ← Back
            </button>
          </div>
        )}
        {loadingHistory && <p className="text-caption text-on-surface-variant">Loading history…</p>}
        <VocaButton variant="primary" onClick={handleAdd} disabled={!effectiveName.trim()}>
          Add exercise
        </VocaButton>
      </div>
    </BottomSheet>
  )
}

// ── Activity Card ─────────────────────────────────────────────────────────────

function ActivityCard({ activity, onUpdate, onDelete }: {
  activity: LiveActivity
  onUpdate: (updated: LiveActivity) => void
  onDelete: () => void
}) {
  const [addingSet, setAddingSet] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [newName, setNewName] = useState(activity.name)

  const lastSet = activity.sets.length > 0 ? activity.sets[activity.sets.length - 1] : null

  const addSet = (set: LiveSet) => {
    onUpdate({ ...activity, sets: [...activity.sets, set] })
    setAddingSet(false)
    setTimeout(() => setAddingSet(true), 50)
  }

  const updateSet = (i: number, patch: Partial<LiveSet>) => {
    const sets = activity.sets.map((s, idx) => idx === i ? { ...s, ...patch } : s)
    onUpdate({ ...activity, sets })
  }

  const removeSet = (i: number) => {
    onUpdate({ ...activity, sets: activity.sets.filter((_, idx) => idx !== i) })
  }

  const finishRename = () => {
    if (newName.trim()) onUpdate({ ...activity, name: newName.trim() })
    setRenaming(false)
    setMenuOpen(false)
  }

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
      {/* Card header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant">
        {renaming ? (
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onBlur={finishRename}
            onKeyDown={(e) => { if (e.key === 'Enter') finishRename() }}
            autoFocus
            className="h-8 flex-1 mr-2 text-body-lg font-semibold"
          />
        ) : (
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-headline text-body-lg font-semibold text-on-surface capitalize truncate">{activity.name}</span>
            <span className="text-caption text-on-surface-variant shrink-0">
              {activity.sets.length} set{activity.sets.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
        <div className="relative shrink-0">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="p-1.5 rounded-lg hover:bg-surface-container transition-colors text-on-surface-variant"
          >
            <Icon name="more_vert" size={20} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-9 z-20 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-xl py-1 w-36">
              <button
                onClick={() => { setRenaming(true); setMenuOpen(false) }}
                className="w-full text-left px-4 py-2.5 text-body-md text-on-surface hover:bg-surface-container transition-colors"
              >
                Rename
              </button>
              <button
                onClick={() => { onDelete(); setMenuOpen(false) }}
                className="w-full text-left px-4 py-2.5 text-body-md text-error hover:bg-error-container/20 transition-colors"
              >
                Remove
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sets */}
      <div className="px-4 py-3 flex flex-col gap-2">
        {activity.sets.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-2">
              <span className="w-5" />
              <p className="text-label-sm text-on-surface-variant text-center">Reps</p>
              <p className="text-label-sm text-on-surface-variant text-center">Weight</p>
              <span className="w-5" />
            </div>
            {activity.sets.map((set, i) => (
              <SetRow
                key={i}
                set={set}
                index={i}
                onChange={(patch) => updateSet(i, patch)}
                onDelete={() => removeSet(i)}
              />
            ))}
          </div>
        )}

        {addingSet ? (
          <AddSetForm lastSet={lastSet} onAdd={addSet} onCancel={() => setAddingSet(false)} />
        ) : (
          <button
            onClick={() => setAddingSet(true)}
            className="flex items-center gap-1.5 text-caption font-semibold text-primary hover:brightness-110 transition-colors pt-1"
          >
            <Icon name="add" size={16} /> Add set
          </button>
        )}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function LiveWorkoutPage() {
  const router = useRouter()

  const [session, setSession] = useState<LiveSessionState | null>(null)
  const [timer, setTimer] = useState('')
  const [addExerciseOpen, setAddExerciseOpen] = useState(false)
  const [finishDialog, setFinishDialog] = useState(false)
  const [discardDialog, setDiscardDialog] = useState(false)
  const [saving, setSaving] = useState(false)
  const [resumePrompt, setResumePrompt] = useState<LiveSessionState | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LIVE_SESSION_STORAGE_KEY)
      if (raw) {
        const saved: LiveSessionState = JSON.parse(raw)
        const age = Date.now() - new Date(saved.startedAt).getTime()
        if (age < FOUR_HOURS) {
          setResumePrompt(saved)
          return
        } else {
          localStorage.removeItem(LIVE_SESSION_STORAGE_KEY)
        }
      }
    } catch { /* ignore */ }
    setSession(emptySession())
  }, [])

  useEffect(() => {
    if (!session) return
    try { localStorage.setItem(LIVE_SESSION_STORAGE_KEY, JSON.stringify(session)) }
    catch { /* quota */ }
  }, [session])

  useEffect(() => {
    if (!session) return
    setTimer(elapsed(session.startedAt))
    const id = setInterval(() => setTimer(elapsed(session.startedAt)), 1000)
    return () => clearInterval(id)
  }, [session])

  const updateActivity = useCallback((id: string, updated: LiveActivity) => {
    setSession((s) => s ? { ...s, activities: s.activities.map((a) => a.id === id ? updated : a) } : s)
  }, [])

  const removeActivity = useCallback((id: string) => {
    setSession((s) => s ? { ...s, activities: s.activities.filter((a) => a.id !== id) } : s)
  }, [])

  const addExercise = useCallback(async (name: string) => {
    const activity = blankActivity(name)
    setSession((s) => s ? { ...s, activities: [...s.activities, activity] } : s)
    try {
      const res = await fetch(`/api/exercise-history?name=${encodeURIComponent(name)}`)
      const d = await res.json()
      if (d.last) {
        const prefilled = blankSet({ weight_kg: d.last.weight_kg ?? undefined, reps: d.last.reps ?? undefined })
        setSession((s) => {
          if (!s) return s
          return {
            ...s,
            activities: s.activities.map((a) =>
              a.id === activity.id ? { ...a, sets: [prefilled] } : a
            ),
          }
        })
      }
    } catch { /* history unavailable */ }
  }, [])

  const handleFinish = useCallback(async () => {
    if (!session) return
    setSaving(true)
    const activityNames = session.activities.map((a) => a.name)
    const sessionLabel = activityNames.length > 0 ? activityNames.slice(0, 3).join(', ') : 'live session'
    const rawLines = session.activities.map((a) => `${a.name}: ${a.sets.length} set${a.sets.length !== 1 ? 's' : ''}`)
    const raw_transcript = `Live workout: ${sessionLabel}. ${rawLines.join(', ')}`

    const data: WorkoutExtraction = {
      session_type: 'lifting',
      session_label: sessionLabel,
      activities: session.activities.map((a) => ({
        type: 'lifting',
        name: a.name,
        sets: a.sets,
        duration_minutes: null,
        intensity_notes: null,
        notes: null,
      })),
      session_notes: session.sessionNotes || null,
      perceived_effort: session.perceivedEffort,
      post_session_symptoms: [],
      ambiguities: ['entry created via Live Workout mode'],
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
      localStorage.removeItem(LIVE_SESSION_STORAGE_KEY)
      toast.success('Session saved!')
      router.push('/timeline/workouts')
    } catch {
      toast.error('Network error — session NOT saved')
      setSaving(false)
    }
  }, [session, router])

  const handleDiscard = useCallback(() => {
    localStorage.removeItem(LIVE_SESSION_STORAGE_KEY)
    router.push('/')
  }, [router])

  // Resume prompt
  if (resumePrompt) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-surface px-5 gap-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-tertiary-container">
          <Icon name="bolt" size={32} fill={1} className="text-on-tertiary-container" />
        </div>
        <div className="text-center">
          <h2 className="font-headline text-headline-md font-bold text-on-surface">Resume session?</h2>
          <p className="text-body-md text-on-surface-variant mt-1">
            {resumePrompt.activities.length} exercise{resumePrompt.activities.length !== 1 ? 's' : ''} in progress
          </p>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <VocaButton variant="primary" onClick={() => { setSession(resumePrompt); setResumePrompt(null) }}>
            Resume session
          </VocaButton>
          <VocaButton variant="ghost" onClick={() => { localStorage.removeItem(LIVE_SESSION_STORAGE_KEY); setSession(emptySession()); setResumePrompt(null) }}>
            Start fresh
          </VocaButton>
        </div>
      </main>
    )
  }

  if (!session) return null

  const canFinish = hasEnoughData(session)

  return (
    <>
      <AlertDialog
        open={finishDialog}
        onOpenChange={setFinishDialog}
        title="Finish and save this session?"
        description={`${session.activities.length} exercise${session.activities.length !== 1 ? 's' : ''}, ${session.activities.reduce((n, a) => n + a.sets.length, 0)} total sets`}
        confirmLabel={saving ? 'Saving…' : 'Save session'}
        onConfirm={handleFinish}
      />
      <AlertDialog
        open={discardDialog}
        onOpenChange={setDiscardDialog}
        title="Discard this session?"
        description="All sets will be lost. This can't be undone."
        confirmLabel="Discard"
        onConfirm={handleDiscard}
        destructive
      />
      <AddExerciseSheet
        open={addExerciseOpen}
        onClose={() => setAddExerciseOpen(false)}
        onAdd={addExercise}
      />

      <div className="flex flex-col min-h-screen bg-surface pb-52">
        {/* Sticky header — monospace timer prominent */}
        <div className="sticky top-0 z-10 glass-nav border-b border-outline-variant">
          <div className="flex items-center justify-between px-container-padding-mobile h-16 max-w-lg mx-auto">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDiscardDialog(true)}
                className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-container-high transition-colors"
              >
                <Icon name="close" size={22} className="text-on-surface-variant" />
              </button>
              <span className="font-mono text-headline-md font-bold text-on-surface tabular-nums tracking-tight">
                {timer}
              </span>
            </div>
            <button
              onClick={() => setFinishDialog(true)}
              disabled={!canFinish || saving}
              className="rounded-full px-5 py-2 text-body-md font-semibold bg-primary text-on-primary disabled:opacity-40 hover:opacity-90 tap-response transition-opacity"
            >
              Finish
            </button>
          </div>
        </div>

        {/* Activities */}
        <div className="flex flex-col gap-4 px-container-padding-mobile py-6 max-w-lg mx-auto w-full">
          {session.activities.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-tertiary-container">
                <Icon name="fitness_center" size={32} fill={1} className="text-on-tertiary-container" />
              </div>
              <p className="text-body-md text-on-surface-variant">Tap below to add your first exercise</p>
            </div>
          )}

          {session.activities.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              onUpdate={(updated) => updateActivity(activity.id, updated)}
              onDelete={() => removeActivity(activity.id)}
            />
          ))}

          <button
            onClick={() => setAddExerciseOpen(true)}
            className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-outline-variant py-4 text-body-md font-semibold text-on-surface-variant hover:border-primary hover:text-primary transition-colors tap-response"
          >
            <Icon name="add" size={20} /> Add exercise
          </button>
        </div>

        {/* Sticky bottom bar — light glass effect */}
        <div className="fixed bottom-0 left-0 right-0 z-10 bg-surface/90 backdrop-blur-xl border-t border-outline-variant">
          <div className="flex flex-col gap-3 px-container-padding-mobile pt-4 pb-8 max-w-lg mx-auto">
            <textarea
              value={session.sessionNotes}
              onChange={(e) => setSession((s) => s ? { ...s, sessionNotes: e.target.value } : s)}
              placeholder="Session notes (optional)"
              rows={2}
              className="w-full bg-transparent border-0 text-body-md text-on-surface placeholder:text-on-surface-variant/50 resize-none focus:outline-none"
            />

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 flex-1">
                <span className="text-label-sm font-medium text-on-surface-variant shrink-0 uppercase tracking-wider">RPE</span>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={session.perceivedEffort ?? 5}
                  onChange={(e) => setSession((s) => s ? { ...s, perceivedEffort: Number(e.target.value) } : s)}
                  onClick={() => { if (session.perceivedEffort === null) setSession((s) => s ? { ...s, perceivedEffort: 5 } : s) }}
                  className="flex-1"
                />
                {session.perceivedEffort !== null ? (
                  <span className="font-headline text-body-lg font-bold text-primary font-mono tabular-nums w-6">{session.perceivedEffort}</span>
                ) : (
                  <span className="text-caption text-on-surface-variant w-6">—</span>
                )}
              </div>

              <VocaButton
                variant="primary"
                onClick={() => setFinishDialog(true)}
                disabled={!canFinish || saving}
                className="w-auto px-6 shrink-0"
              >
                {saving ? 'Saving…' : 'Finish session'}
              </VocaButton>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
